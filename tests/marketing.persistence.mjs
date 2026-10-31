import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { createMarketingHandler, createMarketingCopyHandler } from '../src/server/marketing.ts';
import { markNotification, clearNotification } from '../src/lib/notificationInbox.ts';

export async function runMarketingChecks(testEnv, check) {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Marketing tests require the Firestore emulator.');
  const admin = initializeApp({ projectId: testEnv.projectId }, `marketing-${randomUUID()}`);
  const db = getFirestore(admin);
  const salonId = 'marketing-test-salon';
  const fixture = {
    'mkt-owner': { role: 'owner', status: 'active', salonId },
    'mkt-old': { role: 'customer', status: 'active', salonId, loyaltyTier: 'Gold' },
    'mkt-recent': { role: 'customer', status: 'active', salonId },
    'mkt-new': { role: 'customer', salonId },
    'mkt-disabled': { role: 'customer', status: 'disabled', salonId },
    'mkt-outsider': { role: 'customer', status: 'active', salonId: 'other-salon' },
  };
  for (const [uid, profile] of Object.entries(fixture)) await db.doc(`users/${uid}`).set({ ...profile, uid });
  for (const [id, days] of [['mkt-old', 90], ['mkt-recent', 7]]) {
    await db.doc(`appointments/${id}`).set({ customerId: id, salonId, status: 'completed', date: new Date(Date.now() - days * 86400000).toISOString().slice(0, 10), serviceName: 'Silk Press' });
  }
  const verifyToken = async (token) => {
    if (!fixture[token]) throw new Error('Invalid fixture token');
    return { uid: token };
  };
  const app = express();
  app.use(express.json());
  const copyRequests = [];
  const generate = async (request) => { copyRequests.push(request); return { text: 'Explore our services and book your next visit.\nSUGGESTED_FOLLOWUPS: ["ignore"]' }; };
  app.post('/api/marketing/copy', createMarketingCopyHandler({ db, verifyToken, model: 'fixture-model', generate }));
  app.post('/api/marketing/copy-unconfigured', createMarketingCopyHandler({ db, verifyToken, model: 'fixture-model', generate: null }));
  app.post('/api/marketing/copy-failed', createMarketingCopyHandler({ db, verifyToken, model: 'fixture-model', generate: async () => { throw Object.assign(new Error('private-provider-error'), { status: 429 }); } }));
  for (const action of ['preview', 'send']) app.post(`/api/marketing/${action}`, createMarketingHandler({ db, verifyToken, preview: action === 'preview' }));
  const failingStore = new Proxy(db, { get(target, key) {
    if (key === 'runTransaction') return async () => { throw new Error('Emulated storage failure'); };
    const value = Reflect.get(target, key);
    return typeof value === 'function' ? value.bind(target) : value;
  } });
  app.post('/api/marketing/fail', createMarketingHandler({ db: failingStore, verifyToken, preview: false }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (action, body, token = 'mkt-owner') => fetch(`${base}/api/marketing/${action}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body),
  });
  const campaign = { campaignId: randomUUID(), segment: 'Inactive Clients (8+ Weeks)', title: 'Emulator test only', message: 'Emulator fixture campaign' };
  const customer = testEnv.authenticatedContext('mkt-old').firestore();
  const inbox = collection(customer, 'users/mkt-old/notifications');
  const target = doc(customer, `users/mkt-old/notifications/${campaign.campaignId}`);
  try {
    await check('marketing copy generation requires an active owner and validates the channel and goal', async () => {
      const body = { segment: 'All Customers', channel: 'in-app', title: 'Book a visit' };
      for (const [token, status] of [[null, 401], ['invalid', 401], ['mkt-old', 403]]) {
        assert.equal((await post('copy', body, token)).status, status);
      }
      for (const patch of [{ channel: 'invalid' }, { title: '' }, { title: 'x'.repeat(121) }, { segment: 'unknown' }]) {
        assert.equal((await post('copy', { ...body, ...patch })).status, 400);
      }
      assert.equal(copyRequests.length, 0);
    });
    await check('marketing AI returns campaign copy rather than advisor follow-ups, without sending it', async () => {
      const body = { segment: 'All Customers', channel: 'sms', title: 'Book a visit' };
      const response = await post('copy', body);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { message: 'Explore our services and book your next visit.' });
      assert.equal(copyRequests[0].model, 'fixture-model');
      assert.deepEqual(JSON.parse(copyRequests[0].contents), { audience: 'All Customers', channel: 'sms', campaignGoal: 'Book a visit' });
      assert(copyRequests[0].config.systemInstruction.includes('Do not invent discounts'));
      assert.equal((await getDocs(inbox)).size, 0);
    });
    await check('marketing copy failures report useful errors without leaking provider messages', async () => {
      const body = { segment: 'All Customers', channel: 'in-app', title: 'Book a visit' };
      assert.equal((await post('copy-unconfigured', body)).status, 503);
      const failed = await post('copy-failed', body);
      assert.equal(failed.status, 429);
      assert(!(await failed.text()).includes('private-provider-error'));
    });
    await check('marketing denies unauthenticated, invalid-token and non-owner sends', async () => {
      for (const [token, status] of [[null, 401], ['invalid', 401], ['mkt-old', 403], ['mkt-disabled', 403]]) {
        assert.equal((await post('send', campaign, token)).status, status);
      }
      assert.equal((await getDocs(inbox)).size, 0);
    });
    await check('marketing rejects invalid segments, empty copy and oversized content', async () => {
      for (const patch of [{ segment: 'unknown' }, { message: '' }, { message: 'a'.repeat(4001) }, { title: '' }, { campaignId: '../bad' }]) {
        assert.equal((await post('send', { ...campaign, ...patch })).status, 400);
      }
    });
    await check('marketing audience preview counts matching customers without sending', async () => {
      const response = await post('preview', campaign);
      assert.equal(response.status, 200);
      assert.equal((await response.json()).delivered, 1);
      assert.equal((await getDocs(inbox)).size, 0);
    });
    await check('marketing failed database writes never return success or create customer deliveries', async () => {
      assert.equal((await post('fail', campaign)).status, 500);
      assert.equal((await getDocs(inbox)).size, 0);
    });
    await check('marketing reaches the selected customer through a live Firestore inbox listener', async () => {
      let stop;
      const observed = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Customer inbox did not receive campaign')), 10000);
        stop = onSnapshot(inbox, (snapshot) => {
          if (snapshot.docs.some((doc) => doc.id === campaign.campaignId && doc.data().message === campaign.message)) {
            clearTimeout(timeout); resolve();
          }
        }, (error) => { clearTimeout(timeout); reject(error); });
      });
      try {
        const response = await post('send', campaign);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { delivered: 1, channel: 'in-app', replayed: false });
        await observed;
      } finally { stop?.(); }
      for (const uid of ['mkt-recent', 'mkt-new', 'mkt-disabled', 'mkt-outsider']) {
        assert.equal((await db.collection(`users/${uid}/notifications`).get()).size, 0);
      }
    });
    await check('marketing retries, including simultaneous sends, do not duplicate customer deliveries', async () => {
      const responses = await Promise.all([post('send', campaign), post('send', campaign)]);
      for (const response of responses) { assert.equal(response.status, 200); assert.equal((await response.json()).replayed, true); }
      assert.equal((await getDocs(inbox)).size, 1);
      assert.equal((await post('send', { ...campaign, message: 'Changed campaign' })).status, 409);
      const parallel = { ...campaign, campaignId: randomUUID() };
      const concurrent = await Promise.all([post('send', parallel), post('send', parallel)]);
      const receipts = await Promise.all(concurrent.map((response) => response.json()));
      assert.equal(receipts.filter((receipt) => receipt.replayed === false).length, 1);
      assert.equal(receipts.filter((receipt) => receipt.replayed === true).length, 1);
      assert.equal((await getDocs(inbox)).size, 2);
    });
    await check('marketing empty audiences return an error instead of a success receipt', async () => {
      assert.equal((await post('send', { ...campaign, campaignId: randomUUID(), segment: 'Custom Color & Balayage Clients' })).status, 409);
    });
    await check('campaign inboxes keep customer messages private and reject forged deliveries', async () => {
      const other = testEnv.authenticatedContext('mkt-recent').firestore();
      const outsiderTarget = doc(other, target.path);
      await assertFails(getDoc(outsiderTarget));
      await assertFails(getDocs(collection(other, 'users/mkt-old/notifications')));
      await assertFails(updateDoc(outsiderTarget, { read: true }));
      await assertFails(deleteDoc(outsiderTarget));
      await assertFails(setDoc(doc(customer, 'users/mkt-old/notifications/forged'), { message: 'Spoofed' }));
      await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), target.path)));
    });
    await check('customer read and clear actions affect only their own campaign inbox', async () => {
      const notification = { ...(await getDoc(target)).data(), id: campaign.campaignId, recipientUid: 'mkt-old' };
      await assertSucceeds(markNotification(notification, true, customer));
      assert.equal((await getDoc(target)).data().read, true);
      await assertFails(updateDoc(target, { message: 'Tampered' }));
      await assertFails(updateDoc(target, { read: 'true' }));
      await assertSucceeds(clearNotification(notification, customer));
      assert.equal((await getDoc(target)).exists(), false);
    });
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await deleteApp(admin);
  }
}
