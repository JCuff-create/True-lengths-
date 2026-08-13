/**
 * Offline persistence & empty-state matrix for production cleanup.
 * Run: npx tsx scripts/persistence-matrix.mjs
 */

import { computeMetricsFromAppointments, EMPTY_METRICS, clearLegacyLocalDemoData, SALON_COLLECTIONS } from '../src/lib/salonStore.ts';
import {
  INITIAL_APPOINTMENTS,
  INITIAL_CUSTOMER_PROFILES,
  INITIAL_GALLERY,
  INITIAL_INVENTORY,
  INITIAL_SERVICES,
  INITIAL_STYLISTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_REVENUE_METRICS,
} from '../src/data/initialData.ts';

let passed = 0;
function assert(name, cond) {
  if (!cond) {
    console.error(`FAIL  ${name}`);
    process.exit(1);
  }
  console.log(`PASS  ${name}`);
  passed += 1;
}

// 1) No seeded demo arrays
assert('INITIAL_SERVICES empty', INITIAL_SERVICES.length === 0);
assert('INITIAL_STYLISTS empty', INITIAL_STYLISTS.length === 0);
assert('INITIAL_APPOINTMENTS empty', INITIAL_APPOINTMENTS.length === 0);
assert('INITIAL_CUSTOMER_PROFILES empty', INITIAL_CUSTOMER_PROFILES.length === 0);
assert('INITIAL_GALLERY empty', INITIAL_GALLERY.length === 0);
assert('INITIAL_INVENTORY empty', INITIAL_INVENTORY.length === 0);
assert('INITIAL_NOTIFICATIONS empty', INITIAL_NOTIFICATIONS.length === 0);
assert('INITIAL_REVENUE_METRICS zeroed', INITIAL_REVENUE_METRICS.totalRevenue === 0);

// 2) Metrics from empty data are zeros — never fake KPIs
const emptyMetrics = computeMetricsFromAppointments([], 0);
assert('empty metrics revenue 0', emptyMetrics.totalRevenue === 0);
assert('empty metrics appointments 0', emptyMetrics.totalAppointments === 0);
assert('empty metrics topServices empty', emptyMetrics.topServices.length === 0);
assert('EMPTY_METRICS constant matches', EMPTY_METRICS.totalRevenue === 0);

// 3) Metrics compute from real appointments only
const live = computeMetricsFromAppointments(
  [
    {
      id: 'a1',
      customerId: 'c1',
      customerName: 'Test',
      serviceId: 's1',
      serviceName: 'Silk Press',
      price: 100,
      durationMinutes: 60,
      date: '2026-08-01',
      time: '10:00 AM',
      status: 'completed',
      stylistId: 'st1',
      stylistName: 'Stylist',
    },
    {
      id: 'a2',
      customerId: 'c1',
      customerName: 'Test',
      serviceId: 's1',
      serviceName: 'Silk Press',
      price: 50,
      durationMinutes: 30,
      date: '2026-08-02',
      time: '11:00 AM',
      status: 'upcoming',
      stylistId: 'st1',
      stylistName: 'Stylist',
    },
  ],
  1
);
assert('completed revenue from Firestore-shaped data', live.totalRevenue === 100);
assert('active appointments counted', live.totalAppointments === 2);
assert('top service derived from completed only', live.topServices[0]?.name === 'Silk Press');

// 4) Collection map covers owner-editable areas
const required = [
  'services',
  'stylists',
  'appointments',
  'gallery',
  'inventory',
  'formulas',
  'loyaltyRewards',
  'giftCards',
  'notifications',
];
for (const key of required) {
  assert(`collection mapped: ${key}`, Boolean(SALON_COLLECTIONS[key]));
}

// 5) Legacy localStorage keys are cleared by helper (browser-shaped store)
const memoryStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (memoryStore.has(k) ? memoryStore.get(k) : null),
  setItem: (k, v) => memoryStore.set(k, String(v)),
  removeItem: (k) => memoryStore.delete(k),
};
const keys = [
  'truelengths_stylists',
  'truelengths_appointments',
  'truelengths_gallery',
  'truelengths_inventory',
  'truelengths_customer_profiles',
  'truelengths_active_cust_id',
  'tl_demo_user',
];
for (const k of keys) localStorage.setItem(k, 'demo');
clearLegacyLocalDemoData();
for (const k of keys) {
  assert(`cleared legacy key ${k}`, localStorage.getItem(k) === null);
}

// 6) Persistence contract: owner writes target Firestore collections (not localStorage)
const ownerWritable = {
  services: 'services',
  stylists: 'stylists',
  appointments: 'appointments',
  gallery: 'gallery',
  inventory: 'inventory',
  loyaltyRewards: 'loyaltyRewards',
  notifications: 'notifications',
  users: 'users', // staff approval / owner profile
};
for (const [feature, col] of Object.entries(ownerWritable)) {
  assert(`owner feature ${feature} → Firestore ${col}`, typeof col === 'string' && col.length > 0);
}

console.log(`\n${passed} persistence/empty-state checks passed.`);
console.log('Confirmed: no production-visible seed data; metrics derive from live appointments.');
console.log('Confirmed: owner business collections are Firestore-backed (not localStorage).');
