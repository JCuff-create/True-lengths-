import assert from 'node:assert/strict';
import test from 'node:test';
import { inventoryThreshold, inventoryStatus, isLowStock, validPurchaseUrl, validateReceivedQuantity, validateInventoryDetails } from '../src/lib/inventory';
import type { InventoryItem } from '../src/types';

const legacy: InventoryItem = {
  id: 'serum', name: 'Serum', brand: 'True Lengths', category: 'Styling & Oils',
  stockCount: 5, reorderLevel: 5, supplier: 'Legacy supplier', unitCost: 10, retailPrice: 20, status: 'in_stock',
};

test('accepts HTTPS Amazon and other supplier URLs without adding tracking', () => {
  for (const url of ['https://www.amazon.com/dp/B123', 'https://supplier.example/products/serum?size=10#details']) {
    assert.equal(validPurchaseUrl(url), url);
  }
  assert.equal(validPurchaseUrl('  https://supplier.example/item  '), 'https://supplier.example/item');
});

test('rejects unsafe schemes and malformed URLs, credentials, whitespace and backslashes', () => {
  for (const url of [undefined, null, '', 'javascript:alert(1)', 'data:text/html,hi', 'http://amazon.com', '//amazon.com',
    'https:amazon.com', 'https:///amazon.com', 'https://', 'https://a b.com', 'https://a.com/a b',
    'https://user:pass@example.com', 'https://example.com:bad', 'https://[broken', 'https://example.com\\evil',
    'https://example.com/\nfoo']) {
    assert.equal(validPurchaseUrl(url), null, String(url));
  }
});

test('old inventory records use reorderLevel without requiring supplier metadata', () => {
  validateInventoryDetails(legacy);
  assert.equal(inventoryThreshold(legacy), 5);
  assert.equal(isLowStock(legacy), true);
  assert.equal(validPurchaseUrl(legacy.purchaseUrl), null);
});

test('low-stock boundary is inclusive and new threshold overrides legacy reorderLevel', () => {
  for (const [stockCount, low] of [[4, true], [5, true], [6, false]] as const) {
    assert.equal(isLowStock({ ...legacy, stockCount }), low);
  }
  assert.equal(isLowStock({ ...legacy, lowStockThreshold: 4 }), false);
  assert.equal(inventoryStatus({ ...legacy, stockCount: 6 }), 'in_stock');
  assert.equal(inventoryStatus(legacy), 'low_stock');
});

test('zero stock and zero threshold are supported', () => {
  const item = { ...legacy, stockCount: 0, lowStockThreshold: 0 };
  validateInventoryDetails(item);
  assert.equal(inventoryThreshold(item), 0);
  assert.equal(isLowStock(item), true);
  assert.equal(inventoryStatus(item), 'out_of_stock');
  assert.equal(isLowStock({ ...item, stockCount: 1 }), false);
});

test('receive stock requires a positive safe whole-number quantity', () => {
  for (const amount of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => validateReceivedQuantity(amount), /positive whole-number/);
  }
  validateReceivedQuantity(1);
  validateReceivedQuantity(10);
});

test('product validation rejects invalid URL, count and thresholds', () => {
  assert.throws(() => validateInventoryDetails({ ...legacy, purchaseUrl: 'http://supplier.example' }), /HTTPS/);
  for (const lowStockThreshold of [-1, 1.2, NaN]) {
    assert.throws(() => validateInventoryDetails({ ...legacy, lowStockThreshold }), /threshold/);
  }
  for (const stockCount of [-1, 1.2, NaN]) {
    assert.throws(() => validateInventoryDetails({ ...legacy, stockCount }), /Stock count/);
  }
});
