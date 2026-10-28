import assert from 'node:assert/strict';
import test from 'node:test';
import {
  commitReceivedStock,
  inventoryVisibleToRole,
  parseReceivedQuantity,
  planReceivedStock,
  purchaseLink,
  stockIndicator,
  type StockActor,
} from '../src/lib/inventoryRestock';

const owner: StockActor = {
  role: 'owner',
  status: 'active',
  salonId: 'truelengths-main',
};

test('legacy inventory records keep working without optional fields', () => {
  const legacy = { id: 'inv-legacy', name: 'Serum', stockCount: 4 };
  assert.equal(purchaseLink(undefined), null);
  assert.equal(stockIndicator(legacy.stockCount, undefined), 'in_stock');
  assert.equal(stockIndicator(undefined, undefined), 'missing');

  const patch = planReceivedStock({ stockCount: legacy.stockCount }, 2, owner);
  assert.deepEqual(patch, { stockCount: 6, status: 'in_stock' });
  assert.equal('purchaseUrl' in patch, false);
  assert.equal('supplier' in patch, false);

  const hidden = inventoryVisibleToRole(
    [{ id: 'inv-legacy', name: 'Serum', stockCount: 4, purchaseUrl: 'https://amazon.com/dp/1' }],
    'customer'
  );
  assert.equal('purchaseUrl' in hidden[0], false);
  assert.equal(hidden[0].name, 'Serum');
  assert.equal(hidden[0].stockCount, 4);
  const stylistCopy = inventoryVisibleToRole(
    [{ id: 'inv-legacy', name: 'Serum', purchaseUrl: 'https://amazon.com/dp/1' }],
    'stylist'
  );
  assert.equal('purchaseUrl' in stylistCopy[0], false);
  assert.deepEqual(
    inventoryVisibleToRole([{ id: 'inv-1', purchaseUrl: 'https://amazon.com/dp/1', supplier: 'Amazon' }], 'owner'),
    [{ id: 'inv-1', purchaseUrl: 'https://amazon.com/dp/1', supplier: 'Amazon' }]
  );
});

test('accepts https purchase links and rejects unsafe schemes without rewriting them', () => {
  const amazon = purchaseLink('  https://www.amazon.com/dp/B001?ref=existing  ');
  assert.deepEqual(amazon, {
    href: 'https://www.amazon.com/dp/B001?ref=existing',
    hostname: 'amazon.com',
  });
  assert.equal(amazon?.href.includes('tag='), false);

  const other = purchaseLink('https://supplier.example/products/serum');
  assert.equal(other?.hostname, 'supplier.example');
  assert.equal(other?.href, 'https://supplier.example/products/serum');

  for (const unsafe of [
    '',
    '   ',
    'javascript:alert(1)',
    'data:text/html,hi',
    'http://www.amazon.com/dp/B001',
    'https://user:pass@amazon.com/dp/B001',
    'not a url',
    '//amazon.com/dp/B001',
  ]) {
    assert.equal(purchaseLink(unsafe), null, unsafe);
  }
});

test('distinguishes missing stock, zero stock, and the low-stock boundary', () => {
  assert.equal(stockIndicator(undefined, 5), 'missing');
  assert.equal(stockIndicator('4', 5), 'missing');
  assert.equal(stockIndicator(-1, 5), 'missing');
  assert.equal(stockIndicator(0, 5), 'out_of_stock');
  assert.equal(stockIndicator(0, 0), 'out_of_stock');
  assert.equal(stockIndicator(0, undefined), 'out_of_stock');
  assert.equal(stockIndicator(1, 1), 'low_stock');
  assert.equal(stockIndicator(5, 5), 'low_stock');
  assert.equal(stockIndicator(6, 5), 'in_stock');
  assert.equal(stockIndicator(2, undefined), 'in_stock');
});

test('rejects invalid received quantities before any write', async () => {
  for (const bad of [0, -3, 1.5, '0', '-1', '1.5', '', '  ', 'abc', Number.NaN]) {
    assert.throws(() => parseReceivedQuantity(bad), /positive whole number/);
  }
  assert.equal(parseReceivedQuantity(2), 2);
  assert.equal(parseReceivedQuantity(' 4 '), 4);

  let writes = 0;
  await assert.rejects(
    () =>
      commitReceivedStock('inv1', 0, owner, {
        transact: async (_id, buildUpdate) => {
          buildUpdate({ stockCount: 4, salonId: 'truelengths-main' });
          writes += 1;
        },
      }),
    /positive whole number/
  );
  assert.equal(writes, 0);
});

test('receives stock atomically and only returns success after the write', async () => {
  const seen: Array<Record<string, unknown>> = [];
  const result = await commitReceivedStock('inv1', 3, owner, {
    transact: async (_id, buildUpdate) => {
      const patch = buildUpdate({
        stockCount: 4,
        reorderLevel: 5,
        supplier: 'Amazon',
        purchaseUrl: 'https://www.amazon.com/dp/B001',
        salonId: 'truelengths-main',
      });
      seen.push(patch);
    },
  });
  assert.deepEqual(result, { stockCount: 7, status: 'in_stock' });
  assert.deepEqual(Object.keys(seen[0]).sort(), ['status', 'stockCount']);
  assert.equal('purchaseUrl' in seen[0], false);
  assert.equal('supplier' in seen[0], false);
});

test('a failed stock write does not report a new quantity', async () => {
  let localStock = 4;
  await assert.rejects(
    () =>
      commitReceivedStock('inv1', 2, owner, {
        transact: async (_id, buildUpdate) => {
          buildUpdate({ stockCount: localStock, reorderLevel: 1, salonId: 'truelengths-main' });
          throw new Error('The database rejected the write.');
        },
      }),
    /count was not changed/
  );
  assert.equal(localStock, 4);
});

test('only the owning salon owner can receive stock', async () => {
  const record = { stockCount: 4, salonId: 'truelengths-main' };
  assert.throws(
    () => planReceivedStock(record, 1, { role: 'stylist', status: 'active', salonId: 'truelengths-main' }),
    /salon owner/
  );
  assert.throws(
    () => planReceivedStock(record, 1, { role: 'customer', status: 'active', salonId: 'truelengths-main' }),
    /salon owner/
  );
  assert.throws(
    () => planReceivedStock(record, 1, { role: 'owner', status: 'pending', salonId: 'truelengths-main' }),
    /salon owner/
  );
  assert.throws(
    () => planReceivedStock({ stockCount: 4, salonId: 'other-salon' }, 1, owner),
    /another salon/
  );
  assert.deepEqual(
    planReceivedStock({ stockCount: 1 }, 1, { role: 'owner', status: 'active' }),
    { stockCount: 2, status: 'in_stock' }
  );

  let writes = 0;
  await assert.rejects(
    () =>
      commitReceivedStock('inv1', 1, { role: 'stylist', status: 'active', salonId: 'truelengths-main' }, {
        transact: async (_id, buildUpdate) => {
          buildUpdate(record);
          writes += 1;
        },
      }),
    /salon owner/
  );
  assert.equal(writes, 0);
});
