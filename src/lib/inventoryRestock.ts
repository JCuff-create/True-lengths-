import { InventoryItem, UserRole, UserStatus } from '../types';
import { DEFAULT_SALON_ID, transactInventoryStock } from './salonStore';

export type StockActor = {
  role?: UserRole;
  status?: UserStatus;
  salonId?: string;
};

export type InventoryStockRecord = {
  stockCount?: unknown;
  reorderLevel?: unknown;
  salonId?: unknown;
  purchaseUrl?: unknown;
  supplier?: unknown;
};

export type ReceivedStockPatch = {
  stockCount: number;
  status: InventoryItem['status'];
};

const OWNER_ONLY = 'Only the salon owner can receive stock.';
const OTHER_SALON = 'This product belongs to another salon.';
const POSITIVE_QUANTITY = 'Enter a positive whole number of units received.';
const INVALID_STOCK = 'This product has no valid stock count to update.';
const MISSING_PRODUCT = 'This product is no longer in inventory.';
const WRITE_FAILED = 'Unable to receive stock. The count was not changed.';

const KNOWN_RECEIVE_ERRORS = new Set([
  OWNER_ONLY,
  OTHER_SALON,
  POSITIVE_QUANTITY,
  INVALID_STOCK,
  MISSING_PRODUCT,
]);

export function readNonnegativeNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return value;
}

export function stockIndicator(
  stockCount: unknown,
  reorderLevel: unknown
): 'missing' | InventoryItem['status'] {
  const stock = readNonnegativeNumber(stockCount);
  if (stock === null) return 'missing';
  if (stock === 0) return 'out_of_stock';
  const threshold = readNonnegativeNumber(reorderLevel);
  if (threshold !== null && stock <= threshold) return 'low_stock';
  return 'in_stock';
}

export function purchaseLink(value: unknown): { href: string; hostname: string } | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password || !parsed.hostname) return null;
  return { href: trimmed, hostname: parsed.hostname.replace(/^www\./i, '') };
}

export function reorderLinkLabel(supplier: unknown, hostname: string): string {
  if (typeof supplier === 'string' && supplier.trim()) return supplier.trim();
  return hostname;
}

export function inventoryVisibleToRole<T extends { purchaseUrl?: string }>(
  items: T[],
  role: UserRole | undefined
): T[] {
  if (role === 'owner') return items;
  return items.map((item) => {
    if (!Object.prototype.hasOwnProperty.call(item, 'purchaseUrl')) return item;
    const rest = { ...item };
    delete rest.purchaseUrl;
    return rest;
  });
}

export function parseReceivedQuantity(value: unknown): number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value.trim())) return Number(value.trim());
  throw new Error(POSITIVE_QUANTITY);
}

export function assertOwnerCanReceiveStock(actor: StockActor, itemSalonId: unknown): void {
  if (actor.role !== 'owner' || actor.status !== 'active') {
    throw new Error(OWNER_ONLY);
  }
  const ownerSalon = actor.salonId || DEFAULT_SALON_ID;
  const itemSalon = typeof itemSalonId === 'string' && itemSalonId.trim()
    ? itemSalonId.trim()
    : DEFAULT_SALON_ID;
  if (itemSalon !== ownerSalon) throw new Error(OTHER_SALON);
}

export function planReceivedStock(
  record: InventoryStockRecord,
  quantity: unknown,
  actor: StockActor
): ReceivedStockPatch {
  assertOwnerCanReceiveStock(actor, record.salonId);
  const received = parseReceivedQuantity(quantity);
  const current = readNonnegativeNumber(record.stockCount);
  if (current === null) throw new Error(INVALID_STOCK);
  const stockCount = current + received;
  const status = stockIndicator(stockCount, record.reorderLevel);
  if (status === 'missing') throw new Error(INVALID_STOCK);
  return { stockCount, status };
}

export async function commitReceivedStock(
  itemId: string,
  quantity: unknown,
  actor: StockActor,
  store: {
    transact: (
      itemId: string,
      buildUpdate: (record: InventoryStockRecord | null) => ReceivedStockPatch
    ) => Promise<void>;
  }
): Promise<ReceivedStockPatch> {
  let applied: ReceivedStockPatch | null = null;
  try {
    await store.transact(itemId, (record) => {
      if (!record) throw new Error(MISSING_PRODUCT);
      applied = planReceivedStock(record, quantity, actor);
      return applied;
    });
  } catch (err: unknown) {
    applied = null;
    const message = err instanceof Error ? err.message : '';
    if (KNOWN_RECEIVE_ERRORS.has(message)) throw err instanceof Error ? err : new Error(message);
    throw new Error(WRITE_FAILED);
  }
  if (!applied) throw new Error(WRITE_FAILED);
  return applied;
}

export function receiveSalonInventoryStock(
  itemId: string,
  quantity: unknown,
  actor: StockActor
): Promise<ReceivedStockPatch> {
  return commitReceivedStock(itemId, quantity, actor, {
    transact: (id, buildUpdate) => transactInventoryStock(id, buildUpdate),
  });
}
