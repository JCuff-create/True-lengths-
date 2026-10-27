import { doc, runTransaction, serverTimestamp, type Firestore, type Transaction } from 'firebase/firestore';
import type { InventoryItem } from '../types';
import { inventoryStatus, validateInventoryDetails, validateReceivedQuantity, validPurchaseUrl } from './inventory';

const LEGACY_SALON_ID = 'truelengths-main';

async function requireOwner(transaction: Transaction, db: Firestore, uid: string, salonId: string) {
  const profile = await transaction.get(doc(db, 'users', uid));
  const user = profile.data();
  if (!user || user.role !== 'owner' || user.status !== 'active' || (user.salonId ?? LEGACY_SALON_ID) !== salonId) {
    throw new Error('Only an active owner of this salon can manage inventory.');
  }
}

function requireSameSalon(data: { salonId?: unknown }, salonId: string) {
  if ((data.salonId ?? LEGACY_SALON_ID) !== salonId) throw new Error('Inventory belongs to another salon.');
}

/** Read the latest count inside a retryable transaction; never use a cached UI count. */
export async function receiveInventoryStock(db: Firestore, uid: string, salonId: string, id: string, amount: number): Promise<void> {
  validateReceivedQuantity(amount);
  await runTransaction(db, async (transaction) => {
    await requireOwner(transaction, db, uid, salonId);
    const ref = doc(db, 'inventory', id);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Inventory product no longer exists.');
    const item = snapshot.data() as InventoryItem & { salonId?: string };
    requireSameSalon(item, salonId);
    const stockCount = item.stockCount + amount;
    if (!Number.isSafeInteger(stockCount) || stockCount < 0) throw new Error('Stock count is outside the supported range.');
    transaction.update(ref, { stockCount, status: inventoryStatus({ ...item, stockCount }), updatedAt: serverTimestamp() });
  });
}

/** Editing supplier details cannot overwrite stock received since the form opened. */
export async function saveInventoryProduct(db: Firestore, uid: string, salonId: string, item: InventoryItem, creating = false): Promise<void> {
  validateInventoryDetails(item);
  await runTransaction(db, async (transaction) => {
    await requireOwner(transaction, db, uid, salonId);
    const ref = doc(db, 'inventory', item.id);
    const snapshot = await transaction.get(ref);
    if (creating === snapshot.exists()) throw new Error(creating ? 'Product already exists.' : 'Inventory product no longer exists.');
    if (snapshot.exists()) requireSameSalon(snapshot.data(), salonId);
    const stockCount = snapshot.exists() ? snapshot.data().stockCount as number : item.stockCount;
    const data = Object.fromEntries(Object.entries({ ...item, stockCount, salonId,
      purchaseUrl: item.purchaseUrl ? validPurchaseUrl(item.purchaseUrl) : '',
      status: inventoryStatus({ ...item, stockCount }), updatedAt: serverTimestamp(),
    }).filter(([, value]) => value !== undefined));
    if (creating) transaction.set(ref, data);
    else transaction.update(ref, data);
  });
}

export async function deleteInventoryProduct(db: Firestore, uid: string, salonId: string, id: string): Promise<void> {
  await runTransaction(db, async (transaction) => {
    await requireOwner(transaction, db, uid, salonId);
    const ref = doc(db, 'inventory', id);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Inventory product no longer exists.');
    requireSameSalon(snapshot.data(), salonId);
    transaction.delete(ref);
  });
}
