import assert from 'node:assert/strict';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { receiveInventoryStock, saveInventoryProduct } from '../src/lib/inventoryPersistence.ts';

export async function runInventoryChecks(testEnv, check) {
  const salonId = 'truelengths-main';
  const owner = testEnv.authenticatedContext('owner1').firestore();
  const otherOwner = testEnv.authenticatedContext('otherOwner').firestore();
  const legacy = { id: 'restock', salonId, name: 'Serum', brand: 'True Lengths', category: 'Styling & Oils', stockCount: 0, reorderLevel: 5, supplier: 'Legacy supplier', unitCost: 10, retailPrice: 20, status: 'out_of_stock' };
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'inventory/restock'), legacy);
    await setDoc(doc(db, 'inventory/other-salon'), { ...legacy, id: 'other-salon', salonId: 'other-salon' });
    await setDoc(doc(db, 'users/otherOwner'), { uid: 'otherOwner', role: 'owner', status: 'active', salonId: 'other-salon' });
    await setDoc(doc(db, 'users/disabledOwner'), { uid: 'disabledOwner', role: 'owner', status: 'disabled', salonId });
  });
  const read = async () => (await getDoc(doc(owner, 'inventory/restock'))).data();

  await check('inventory owner receives stock into a zero-stock legacy record', async () => {
    await receiveInventoryStock(owner, 'owner1', salonId, 'restock', 5);
    const item = await read();
    assert.equal(item.stockCount, 5);
    assert.equal(item.status, 'low_stock');
    assert.equal(item.purchaseUrl, undefined);
  });
  await check('inventory simultaneous receipts preserve both changes', async () => {
    await Promise.all([
      receiveInventoryStock(owner, 'owner1', salonId, 'restock', 3),
      receiveInventoryStock(owner, 'owner1', salonId, 'restock', 4),
    ]);
    assert.equal((await read()).stockCount, 12);
    assert.equal((await read()).status, 'in_stock');
  });
  await check('inventory stale product edit preserves received stock and persists supplier fields', async () => {
    await saveInventoryProduct(owner, 'owner1', salonId, { ...legacy, supplierName: 'Amazon', purchaseUrl: 'https://www.amazon.com/dp/B123', lowStockThreshold: 12 });
    const item = await read();
    assert.equal(item.stockCount, 12);
    assert.equal(item.status, 'low_stock');
    assert.equal(item.supplierName, 'Amazon');
    assert.equal(item.purchaseUrl, 'https://www.amazon.com/dp/B123');
    assert.equal(item.lowStockThreshold, 12);
  });
  await check('inventory invalid receipts reject and leave persisted stock unchanged', async () => {
    for (const amount of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      await assert.rejects(receiveInventoryStock(owner, 'owner1', salonId, 'restock', amount), /positive whole-number/);
    }
    assert.equal((await read()).stockCount, 12);
  });
  await check('inventory missing-product receipt rejects without creating a document', async () => {
    await assert.rejects(receiveInventoryStock(owner, 'owner1', salonId, 'missing', 1));
    await testEnv.withSecurityRulesDisabled(async (context) => {
      assert.equal((await getDoc(doc(context.firestore(), 'inventory/missing'))).exists(), false);
    });
  });
  await check('inventory failed unauthorized receipt rejects and leaves stock unchanged', async () => {
    for (const uid of ['customer1', 'stylist1', 'pending1', 'disabledOwner']) {
      const db = testEnv.authenticatedContext(uid).firestore();
      await assert.rejects(receiveInventoryStock(db, uid, salonId, 'restock', 1));
      await assertFails(updateDoc(doc(db, 'inventory/restock'), { stockCount: 99 }));
    }
    assert.equal((await read()).stockCount, 12);
  });
  await check('inventory unauthenticated writes are denied', async () => {
    await assertFails(updateDoc(doc(testEnv.unauthenticatedContext().firestore(), 'inventory/restock'), { stockCount: 99 }));
  });
  await check('inventory another salon owner cannot read, receive, edit or delete', async () => {
    await assertFails(getDoc(doc(otherOwner, 'inventory/restock')));
    await assert.rejects(receiveInventoryStock(otherOwner, 'otherOwner', 'other-salon', 'restock', 1));
    await assertFails(updateDoc(doc(otherOwner, 'inventory/restock'), { stockCount: 99 }));
    await assertFails(deleteDoc(doc(otherOwner, 'inventory/restock')));
    await assertFails(setDoc(doc(otherOwner, 'inventory/cross-create'), { ...legacy, id: 'cross-create' }));
    assert.equal((await read()).stockCount, 12);
  });
  await check('inventory owner cannot spoof salon or reassign a product', async () => {
    await assert.rejects(receiveInventoryStock(owner, 'owner1', 'other-salon', 'other-salon', 1));
    await assertFails(updateDoc(doc(owner, 'inventory/restock'), { salonId: 'other-salon' }));
    await assertFails(updateDoc(doc(owner, 'inventory/other-salon'), { salonId }));
  });
  await check('inventory owner and stylist queries are scoped to their salon', async () => {
    for (const db of [owner, testEnv.authenticatedContext('stylist1').firestore()]) {
      const items = await assertSucceeds(getDocs(query(collection(db, 'inventory'), where('salonId', '==', salonId))));
      assert(items.docs.some((item) => item.id === 'restock'));
      assert(items.docs.every((item) => item.data().salonId === salonId));
      await assertFails(getDocs(collection(db, 'inventory')));
    }
  });
  await check('inventory customer cannot query supplier information', async () => {
    const db = testEnv.authenticatedContext('customer1').firestore();
    await assertFails(getDocs(query(collection(db, 'inventory'), where('salonId', '==', salonId))));
  });
  await check('inventory rules reject unsafe purchase schemes, malformed URLs and invalid quantities', async () => {
    for (const purchaseUrl of ['javascript:alert(1)', 'data:text/html,hi', 'http://amazon.com', 'broken', 'https://', 'https:///amazon.com', 'https://a b.com']) {
      await assertFails(updateDoc(doc(owner, 'inventory/restock'), { purchaseUrl }));
    }
    for (const stockCount of [-1, 1.5]) await assertFails(updateDoc(doc(owner, 'inventory/restock'), { stockCount }));
    for (const lowStockThreshold of [-1, 1.5]) await assertFails(updateDoc(doc(owner, 'inventory/restock'), { lowStockThreshold }));
  });
  await check('inventory new supplier product can be created without tracking additions', async () => {
    await saveInventoryProduct(owner, 'owner1', salonId, { ...legacy, id: 'new-supplier', supplierName: 'Salon supplier', purchaseUrl: 'https://supplier.example/item', lowStockThreshold: 0 }, true);
    const item = (await getDoc(doc(owner, 'inventory/new-supplier'))).data();
    assert.equal(item.purchaseUrl, 'https://supplier.example/item');
    assert.equal(item.status, 'out_of_stock');
  });
}
