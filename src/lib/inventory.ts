import type { InventoryItem } from '../types';

export function validPurchaseUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^https:\/\/[^/?#]/i.test(trimmed) || /[\s\\\u0000-\u001f\u007f]/.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' && url.hostname && !url.username && !url.password
      ? url.href : null;
  } catch {
    return null;
  }
}

export function inventoryThreshold(item: Pick<InventoryItem, 'lowStockThreshold' | 'reorderLevel'>): number {
  return item.lowStockThreshold ?? item.reorderLevel ?? 0;
}

export function isLowStock(item: Pick<InventoryItem, 'stockCount' | 'lowStockThreshold' | 'reorderLevel'>): boolean {
  return item.stockCount <= inventoryThreshold(item);
}

export function inventoryStatus(item: Pick<InventoryItem, 'stockCount' | 'lowStockThreshold' | 'reorderLevel'>): InventoryItem['status'] {
  return item.stockCount === 0 ? 'out_of_stock' : isLowStock(item) ? 'low_stock' : 'in_stock';
}

export function validateReceivedQuantity(amount: number): void {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error('Enter a positive whole-number quantity.');
  }
}

export function validateInventoryDetails(item: InventoryItem): void {
  if (item.purchaseUrl && !validPurchaseUrl(item.purchaseUrl)) {
    throw new Error('Enter a valid HTTPS purchase URL.');
  }
  if (!Number.isSafeInteger(inventoryThreshold(item)) || inventoryThreshold(item) < 0) {
    throw new Error('Low-stock threshold must be a non-negative whole number.');
  }
  if (!Number.isSafeInteger(item.stockCount) || item.stockCount < 0) {
    throw new Error('Stock count must be a non-negative whole number.');
  }
}
