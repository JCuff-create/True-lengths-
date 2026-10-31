import assert from 'node:assert/strict';
import test from 'node:test';
import { campaignRecipients, requestMarketing, createMarketingDraft, saveMarketingDraft, loadMarketingDraft, marketingDraftText,
  requestMarketingCopy, type MarketingCampaign } from '../src/lib/marketing';

const customers = [
  { id: 'old', role: 'customer', status: 'active', loyaltyTier: 'Gold' },
  { id: 'recent', role: 'customer', status: 'active' },
  { id: 'new', role: 'customer' },
  { id: 'disabled', role: 'customer', status: 'disabled' },
  { id: 'pending', role: 'customer', status: 'pending' },
  { id: 'staff', role: 'stylist', status: 'active' },
  { id: 'other', role: 'customer', salonId: 'other' },
];
const now = new Date('2026-10-28T12:00:00Z');
const visits = [
  { customerId: 'old', status: 'completed', date: '2026-08-01', serviceName: 'Silk Press' },
  { customerId: 'recent', status: 'completed', date: '2026-10-21', serviceName: 'Custom Balayage' },
  { customerId: 'new', status: 'canceled', date: '2026-01-01', serviceName: 'Silk Press' },
  { customerId: 'new', status: 'completed', date: '2026-01-01', serviceName: 'Silk Press', salonId: 'other' },
];

test('marketing audiences exclude staff, disabled/pending accounts and other salons', () => {
  assert.deepEqual(campaignRecipients(customers, visits, 'truelengths-main', 'All Customers', now), ['old', 'recent', 'new']);
});
test('marketing segments use actual completed visits and loyalty tiers', () => {
  const audience = (segment: MarketingCampaign['segment']) => campaignRecipients(customers, visits, 'truelengths-main', segment, now);
  assert.deepEqual(audience('Inactive Clients (8+ Weeks)'), ['old']);
  assert.deepEqual(audience('Silk Press Enthusiasts'), ['old']);
  assert.deepEqual(audience('Custom Color & Balayage Clients'), ['recent']);
  assert.deepEqual(audience('VIP Gold Members'), ['old']);
  assert.deepEqual(campaignRecipients(customers, [...visits, { customerId: 'old', status: 'completed', date: '2026-10-20' }], 'truelengths-main', 'Inactive Clients (8+ Weeks)', now), []);
});

const campaign: MarketingCampaign = { campaignId: '00000000-0000-4000-8000-000000000001', segment: 'All Customers', title: 'Test offer', message: 'Fixture only' };
test('marketing client authenticates and accepts only confirmed delivery receipts', async () => {
  const receipt = await requestMarketing('send', campaign, 'fixture-token', async (url, init) => {
    assert.equal(url, '/api/marketing/send');
    assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer fixture-token');
    assert.deepEqual(JSON.parse(String(init?.body)), campaign);
    return Response.json({ delivered: 2, channel: 'in-app', replayed: false });
  });
  assert.equal(receipt.delivered, 2);
});
test('marketing client never reports success for denied, malformed, static-host or network failures', async () => {
  for (const response of [Response.json({ error: 'Owner required' }, { status: 403 }), Response.json({}), Response.json(null), Response.json({ delivered: -1, channel: 'in-app' }), new Response('<html>App</html>')]) {
    await assert.rejects(requestMarketing('send', campaign, 'fixture', async () => response));
  }
  await assert.rejects(requestMarketing('send', campaign, 'fixture', async () => { throw new Error('Network unavailable'); }));
});

test('saved marketing drafts preserve the retry ID, message and delivery receipt across reloads and isolate owners', () => {
  const records = new Map<string, string>();
  const storage = { getItem: (key: string) => records.get(key) || null, setItem: (key: string, value: string) => { records.set(key, value); } };
  const draft = { ...createMarketingDraft(), title: 'Saved offer', message: 'Keep my edits' };
  assert.equal(saveMarketingDraft(storage, 'owner-a', draft), true);
  assert.deepEqual(loadMarketingDraft(storage, 'owner-a'), draft);
  assert.equal(loadMarketingDraft(storage, 'owner-b'), null);
  const sent = { ...draft, delivered: 3 };
  saveMarketingDraft(storage, 'owner-a', sent);
  assert.deepEqual(loadMarketingDraft(storage, 'owner-a'), sent);
  assert(marketingDraftText(sent).includes('Saved offer\n\nKeep my edits'));
});

test('draft recovery rejects corrupt or oversized content and handles unavailable browser storage', () => {
  const draft = createMarketingDraft();
  for (const value of ['invalid JSON', 'null', JSON.stringify({ ...draft, version: 1, message: 'x'.repeat(4001) }),
    JSON.stringify({ ...draft, version: 1, campaignId: '../invalid' }), JSON.stringify({ ...draft, version: 1, delivered: -1 })]) {
    assert.equal(loadMarketingDraft({ getItem: () => value, setItem: () => {} }, 'owner'), null);
  }
  const unavailable = { getItem: () => { throw new Error('Blocked storage'); }, setItem: () => { throw new Error('Quota exceeded'); } };
  assert.equal(loadMarketingDraft(unavailable, 'owner'), null);
  assert.equal(saveMarketingDraft(unavailable, 'owner', draft), false);
});

test('copy generation uses its authenticated marketing endpoint and rejects failed or unusable drafts', async () => {
  const input = { segment: 'All Customers' as const, channel: 'in-app' as const, title: 'A new visit' };
  const message = await requestMarketingCopy(input, 'fixture', async (url, init) => {
    assert.equal(url, '/api/marketing/copy');
    assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer fixture');
    assert.deepEqual(JSON.parse(String(init?.body)), input);
    return Response.json({ message: ' Ready to book? ' });
  });
  assert.equal(message, 'Ready to book?');
  for (const response of [Response.json({ error: 'AI not connected' }, { status: 503 }), Response.json({ message: '' }),
    Response.json({ message: 'x'.repeat(4001) }), new Response('<html>App</html>'), Response.json(null)]) {
    await assert.rejects(requestMarketingCopy(input, 'fixture', async () => response));
  }
  await assert.rejects(requestMarketingCopy(input, 'fixture', async () => { throw new Error('Network'); }), /draft was kept/);
});
