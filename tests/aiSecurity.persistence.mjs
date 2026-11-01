import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { assertFails } from '@firebase/rules-unit-testing';
import { createAiAccess, aiLimits, AI_MAX_OUTPUT_TOKENS } from '../src/server/aiAccess.ts';
import { createAssistantHandler } from '../src/server/assistant.ts';
import { createMarketingCopyHandler } from '../src/server/marketing.ts';

export async function runAiSecurityChecks(testEnv, check) {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('AI security tests require the Firestore emulator');
  const admin = initializeApp({ projectId: testEnv.projectId }, `ai-security-${randomUUID()}`);
  const db = getFirestore(admin);
  const salon = 'ai-security-salon';
  const profiles = {
    'ai-a': { role: 'customer', status: 'active', salonId: salon },
    'ai-b': { role: 'customer', status: 'active', salonId: salon },
    'ai-owner': { role: 'owner', status: 'active', salonId: salon },
    'ai-disabled': { role: 'owner', status: 'disabled', salonId: salon },
    'ai-pending': { role: 'stylist', status: 'pending', salonId: salon },
    'ai-stylist': { role: 'stylist', status: 'active', salonId: salon },
    'ai-outsider': { role: 'owner', status: 'active', salonId: 'ai-other-salon' },
  };
  for (const [uid, profile] of Object.entries(profiles)) await db.doc(`users/${uid}`).set(profile);
  await db.doc('appointments/ai-salon-completed').set({ salonId: salon, status: 'completed', price: 125, serviceName: 'Silk Press', customerName: 'PRIVATE_CUSTOMER', customerPhone: 'PRIVATE_PHONE' });
  await db.doc('appointments/ai-salon-upcoming').set({ salonId: salon, status: 'upcoming', price: 75 });
  await db.doc('appointments/ai-other-completed').set({ salonId: 'ai-other-salon', status: 'completed', price: 87654 });
  let time = Date.parse('2026-11-01T12:00:10Z');
  const defaults = { ...aiLimits({}), userPerMinute: 100, salonPerMinute: 100, userPerDay: 100, salonPerDay: 100, requestTimeoutMs: 15000 };
  const verifyToken = async (token) => {
    if (['invalid', 'expired', 'revoked'].includes(token)) throw new Error('Rejected Firebase fixture token');
    // Deliberately ignore token role claims; the production adapter uses Admin verifyIdToken(token, true).
    return { uid: token, role: 'owner' };
  };
  const clear = async () => {
    const snapshot = await db.collection('aiUsage').get();
    const batch = db.batch(); snapshot.docs.forEach((doc) => batch.delete(doc.ref)); await batch.commit();
  };
  const access = (limits = {}) => createAiAccess({ db, verifyToken, now: () => time, limits: { ...defaults, ...limits } });
  async function withApi(security, generate, run) {
    const app = express(); app.use(express.json());
    const options = { access: security, generate, model: 'fixture-model' };
    app.post('/customer', createAssistantHandler('customer', options));
    app.post('/owner', createAssistantHandler('owner', options));
    app.post('/copy', createMarketingCopyHandler(options));
    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const post = (route, uid, body = { prompt: 'Help me', history: [] }) => fetch(`${base}/${route}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(uid ? { Authorization: `Bearer ${uid}` } : {}) }, body: JSON.stringify(body),
    });
    try { await run(post); } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
  }
  const reply = async () => ({ text: 'Fixture reply' });
  try {
    await check('AI signed-out, expired, revoked and invalid tokens are rejected before generation', async () => {
      await clear(); let calls = 0;
      await withApi(access(), async () => { calls++; return reply(); }, async (post) => {
        for (const route of ['customer', 'owner', 'copy']) for (const uid of [null, 'invalid', 'expired', 'revoked']) {
          assert.equal((await post(route, uid)).status, 401);
        }
      });
      assert.equal(calls, 0); assert.equal((await db.collection('aiUsage').get()).size, 0);
    });
    await check('AI customer and stylist accounts cannot use owner features or spoof owner/salon claims', async () => {
      await clear(); let calls = 0;
      await withApi(access(), async () => { calls++; return reply(); }, async (post) => {
        for (const uid of ['ai-a', 'ai-stylist']) for (const route of ['owner', 'copy']) {
          assert.equal((await post(route, uid, { prompt: 'Help', role: 'owner', salonId: salon, businessData: { totalRevenue: 999999 } })).status, 403);
        }
        for (const uid of ['ai-disabled', 'ai-pending', 'ai-missing']) assert.equal((await post('customer', uid)).status, 403);
      });
      assert.equal(calls, 0);
    });
    await check('AI owner metrics come from the verified salon only and exclude client metrics and customer PII', async () => {
      await clear(); const requests = [];
      await withApi(access(), async (request) => { requests.push(request); return reply(); }, async (post) => {
        assert.equal((await post('owner', 'ai-owner', { prompt: 'Summarize', salonId: 'ai-other-salon', businessData: { totalRevenue: 999999 } })).status, 200);
        assert.equal((await post('owner', 'ai-outsider')).status, 200);
        assert.equal((await post('customer', 'ai-a')).status, 200);
      });
      const instruction = requests[0].config.systemInstruction;
      assert(instruction.includes('125')); assert(!instruction.includes('87654')); assert(!instruction.includes('999999'));
      assert(!instruction.includes('PRIVATE_CUSTOMER')); assert(!instruction.includes('PRIVATE_PHONE'));
      assert(requests[1].config.systemInstruction.includes('87654')); assert(!requests[2].config.systemInstruction.includes('125'));
      for (const request of requests) { assert.equal(request.config.maxOutputTokens, AI_MAX_OUTPUT_TOKENS); assert(request.config.abortSignal instanceof AbortSignal); }
    });
    await check('AI per-user request rate limits stop further generation', async () => {
      await clear(); let calls = 0;
      await withApi(access({ userPerMinute: 1 }), async () => { calls++; return reply(); }, async (post) => {
        assert.equal((await post('customer', 'ai-a')).status, 200);
        const blocked = await post('customer', 'ai-a'); assert.equal(blocked.status, 429);
        assert.equal((await blocked.json()).error.code, 'AI_RATE_LIMITED'); assert(Number(blocked.headers.get('Retry-After')) > 0);
        assert.equal((await post('customer', 'ai-b')).status, 200);
      });
      assert.equal(calls, 2);
    });
    await check('AI per-salon request limits aggregate different users and all generation endpoints', async () => {
      await clear(); let calls = 0;
      await withApi(access({ salonPerMinute: 2 }), async () => { calls++; return reply(); }, async (post) => {
        assert.equal((await post('customer', 'ai-a')).status, 200);
        assert.equal((await post('copy', 'ai-owner', { segment: 'All Customers', channel: 'sms', title: 'Fixture' })).status, 200);
        assert.equal((await post('owner', 'ai-owner')).status, 429);
        assert.equal((await post('customer', 'ai-b')).status, 429);
      });
      assert.equal(calls, 2);
    });
    await check('AI daily user usage persists across new service instances and minute boundaries', async () => {
      await clear(); let calls = 0;
      const generate = async () => { calls++; return reply(); };
      await withApi(access({ userPerDay: 1 }), generate, async (post) => assert.equal((await post('customer', 'ai-a')).status, 200));
      time += 120000;
      await withApi(access({ userPerDay: 1 }), generate, async (post) => {
        const blocked = await post('customer', 'ai-a'); assert.equal(blocked.status, 429);
        assert.equal((await blocked.json()).error.code, 'AI_QUOTA_EXHAUSTED');
      });
      assert.equal(calls, 1);
      time += 86400000;
      await withApi(access({ userPerDay: 1 }), generate, async (post) => assert.equal((await post('customer', 'ai-a')).status, 200));
      assert.equal(calls, 2);
    });
    await check('AI exact usage-unit allowance admits one generation and blocks the next', async () => {
      await clear(); let reserved;
      const security = access();
      await withApi({ ...security, reserve: async (actor, units, signal) => { reserved = units; await security.reserve(actor, units, signal); } }, reply,
        async (post) => assert.equal((await post('customer', 'ai-a')).status, 200));
      assert(Number.isSafeInteger(reserved));
      for (const scope of ['userDailyUnits', 'salonDailyUnits']) {
        await clear(); let calls = 0;
        await withApi(access({ [scope]: reserved }), async () => { calls++; return reply(); }, async (post) => {
          assert.equal((await post('customer', 'ai-a')).status, 200);
          assert.equal((await post('customer', 'ai-a')).status, 429);
        });
        assert.equal(calls, 1);
      }
    });
    await check('AI daily salon request and usage-unit caps stop all further generation', async () => {
      for (const limits of [{ salonPerDay: 1 }, { userDailyUnits: 1 }, { salonDailyUnits: 1 }]) {
        await clear(); let calls = 0;
        await withApi(access(limits), async () => { calls++; return reply(); }, async (post) => {
          if (limits.salonPerDay) {
            assert.equal((await post('customer', 'ai-a')).status, 200);
            const blocked = await post('customer', 'ai-b'); assert.equal(blocked.status, 429);
            assert.equal((await blocked.json()).error.code, 'AI_QUOTA_EXHAUSTED');
          } else assert.equal((await post('customer', 'ai-a')).status, 429);
        });
        assert.equal(calls, limits.salonPerDay ? 1 : 0);
      }
    });
    await check('AI concurrent requests across service instances cannot overspend a shared quota', async () => {
      await clear(); let calls = 0;
      const generate = async () => { calls++; return reply(); };
      await withApi(access({ salonPerDay: 2 }), generate, async (postA) => {
        await withApi(access({ salonPerDay: 2 }), generate, async (postB) => {
          const responses = await Promise.all(Array.from({ length: 6 }, (_, index) => (index % 2 ? postA : postB)('customer', index % 2 ? 'ai-a' : 'ai-b')));
          assert.equal(responses.filter((response) => response.status === 200).length, 2);
          assert(responses.every((response) => [200, 429].includes(response.status)));
        });
      });
      assert.equal(calls, 2);
    });
    await check('AI provider failures consume their reserved allowance and cannot reset quotas', async () => {
      await clear(); let calls = 0;
      await withApi(access({ userPerDay: 1 }), async () => { calls++; throw new Error('Private provider failure'); }, async (post) => {
        assert.equal((await post('customer', 'ai-a')).status, 502);
        assert.equal((await post('customer', 'ai-a')).status, 429);
      });
      assert.equal(calls, 1);
    });
    await check('AI quota storage failures and oversized conversations fail closed before generation', async () => {
      await clear(); let calls = 0;
      const security = access();
      await withApi({ ...security, reserve: async () => { throw new Error('Quota store unavailable'); } }, async () => { calls++; return reply(); }, async (post) => {
        assert.equal((await post('customer', 'ai-a')).status, 502);
      });
      await withApi(security, async () => { calls++; return reply(); }, async (post) => {
        const response = await post('customer', 'ai-a', { prompt: 'Help', history: Array.from({ length: 12 }, () => ({ sender: 'user', text: 'x'.repeat(2000) })) });
        assert.equal(response.status, 413);
      });
      assert.equal(calls, 0);
    });
    await check('AI deadlines cover authentication, data reads and providers that ignore aborts', async () => {
      await clear(); let calls = 0; let providerSignal;
      const never = async () => new Promise(() => {});
      for (const stage of ['auth', 'data', 'provider']) {
        const security = { ...access(), timeoutMs: 30, reserve: async () => {},
          authorize: async () => ({ uid: 'ai-owner', salonId: salon, role: 'owner' }), businessData: async () => ({ totalRevenue: 125 }) };
        if (stage === 'auth') security.authorize = never;
        if (stage === 'data') security.businessData = never;
        await withApi(security, async (request) => { calls++; providerSignal = request.config.abortSignal; return never(); }, async (post) => {
          assert.equal((await post('owner', 'ai-owner')).status, 504);
        });
      }
      assert.equal(calls, 1); assert.equal(providerSignal.aborted, true);
    });
    await check('AI usage counters cannot be read, edited, reset or forged by customers or owners', async () => {
      await db.doc('aiUsage/private-fixture').set({ requests: 1, units: 100 });
      for (const uid of ['ai-a', 'ai-owner']) {
        const ref = doc(testEnv.authenticatedContext(uid).firestore(), 'aiUsage/private-fixture');
        await assertFails(getDoc(ref)); await assertFails(updateDoc(ref, { requests: 0 })); await assertFails(deleteDoc(ref));
        await assertFails(setDoc(doc(testEnv.authenticatedContext(uid).firestore(), 'aiUsage/forged'), { requests: 0 }));
      }
    });
  } finally { await deleteApp(admin); }
}
