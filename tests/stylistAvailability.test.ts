import assert from 'node:assert/strict';
import test from 'node:test';
import { Stylist } from '../src/types';
import {
  buildBookableTimes,
  formatWorkingTime,
  isStylistWorkingOnDate,
  normalizeWeeklyAvailability,
} from '../src/lib/stylistAvailability';

const stylist: Stylist = {
  id: 'stylist-1',
  name: 'Test Stylist',
  roleTitle: 'Stylist',
  bio: '',
  avatar: '',
  rating: 5,
  totalReviews: 0,
  specialties: [],
  commissionRate: 0.5,
};

test('legacy stylists receive safe default working hours', () => {
  const hours = normalizeWeeklyAvailability();
  assert.equal(hours.monday.enabled, true);
  assert.equal(hours.monday.start, '09:00');
  assert.equal(hours.sunday.enabled, false);
});

test('builds appointment slots that fit before closing time', () => {
  const configured: Stylist = {
    ...stylist,
    weeklyAvailability: {
      ...normalizeWeeklyAvailability(),
      tuesday: { enabled: true, start: '10:00', end: '13:00' },
    },
  };

  assert.deepEqual(buildBookableTimes(configured, '2026-10-13', 90), [
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
  ]);
});

test('closed days return no appointment slots', () => {
  assert.equal(isStylistWorkingOnDate(stylist, '2026-10-11'), false);
  assert.deepEqual(buildBookableTimes(stylist, '2026-10-11', 60), []);
});

test('formats 24-hour values for customer display', () => {
  assert.equal(formatWorkingTime('09:30'), '9:30 AM');
  assert.equal(formatWorkingTime('17:00'), '5:00 PM');
});
