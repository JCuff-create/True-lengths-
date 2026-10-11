import assert from 'node:assert/strict';
import test from 'node:test';
import { buildBookableStylistDirectory } from '../src/lib/stylistDirectory';
import { Stylist } from '../src/types';

function stylist(id: string, name: string, active?: boolean): Stylist {
  return {
    id,
    name,
    active,
    roleTitle: 'Stylist',
    bio: '',
    avatar: '',
    rating: 0,
    totalReviews: 0,
    specialties: [],
    commissionRate: 0.5,
  };
}

test('prefers an explicitly active account over a same-name legacy record', () => {
  const result = buildBookableStylistDirectory([
    stylist('legacy', 'Carolyn Cuff'),
    stylist('account', '  CAROLYN   CUFF ', true),
  ]);

  assert.deepEqual(result.map(({ id }) => id), ['account']);
});

test('keeps two legitimate explicitly active stylists with the same name', () => {
  const result = buildBookableStylistDirectory([
    stylist('one', 'Alex Smith', true),
    stylist('two', 'Alex Smith', true),
  ]);

  assert.deepEqual(result.map(({ id }) => id), ['one', 'two']);
});

test('removes disabled records and collapses duplicate legacy records', () => {
  const result = buildBookableStylistDirectory([
    stylist('legacy-one', 'Tina Jones'),
    stylist('legacy-two', 'Tina Jones'),
    stylist('disabled', 'Morgan Lee', false),
  ]);

  assert.deepEqual(result.map(({ id }) => id), ['legacy-one']);
});
