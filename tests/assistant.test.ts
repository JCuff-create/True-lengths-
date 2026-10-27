import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import type { GenerateContentParameters } from '@google/genai';
import { assistantConfiguration, createAssistantHandler, DEFAULT_GEMINI_MODEL, parseAssistantReply } from '../src/server/assistant';

type Generate = (request: GenerateContentParameters) => Promise<{ text?: string }>;
async function withApi(generate: Generate | null, run: (base: string) => Promise<void>) {
  const app = express();
  app.use(express.json());
  for (const kind of ['customer', 'owner'] as const) {
    app.post(`/api/ai/${kind}-assistant`, createAssistantHandler(kind, { model: DEFAULT_GEMINI_MODEL, generate }));
  }
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); }
}
function post(base: string, kind: string, body: unknown) {
  return fetch(`${base}/api/ai/${kind}-assistant`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

test('AI configuration rejects missing/example keys and permits a supported model override', () => {
  for (const key of [undefined, '', '  ', 'MY_GEMINI_API_KEY']) {
    assert.equal(assistantConfiguration({ GEMINI_API_KEY: key }).apiKey, undefined);
  }
  assert.equal(assistantConfiguration({}).model, 'gemini-flash-latest');
  assert.deepEqual(assistantConfiguration({ GEMINI_API_KEY: ' example-test-key ', GEMINI_MODEL: ' custom-model ' }), { apiKey: 'example-test-key', model: 'custom-model' });
});

test('AI reply parser keeps text, sanitizes suggestions, and tolerates malformed follow-ups', () => {
  assert.deepEqual(parseAssistantReply('Advice\nSUGGESTED_FOLLOWUPS: [" Next? ", null, 5, "Second?", "Third?", "Fourth?"]', 'customer'), { text: 'Advice', suggestions: ['Next?', 'Second?', 'Third?'] });
  assert.equal(parseAssistantReply('Advice\nSUGGESTED_FOLLOWUPS: not JSON', 'owner').text, 'Advice');
  assert.equal(parseAssistantReply('Advice', 'owner').suggestions.length, 3);
  assert.throws(() => parseAssistantReply('  ', 'owner'), /Empty model/);
});

for (const kind of ['customer', 'owner'] as const) {
  test(`${kind} API returns explicit 503 when no Gemini key is configured`, async () => {
    await withApi(null, async (base) => {
      const response = await post(base, kind, { prompt: 'Help me' });
      assert.equal(response.status, 503);
      const data = await response.json();
      assert.equal(data.error.code, 'AI_NOT_CONFIGURED');
      assert.equal(data.text, undefined);
    });
  });

  test(`${kind} API validates prompt before calling Gemini`, async () => {
    let calls = 0;
    await withApi(async () => { calls++; return { text: 'Advice' }; }, async (base) => {
      for (const body of [{}, { prompt: '' }, { prompt: '   ' }, { prompt: 123 }, { prompt: 'a'.repeat(8001) }, null]) {
        const response = await post(base, kind, body);
        assert.equal(response.status, 400);
        if (body !== null) assert.equal((await response.json()).error.code, 'INVALID_PROMPT');
      }
    });
    assert.equal(calls, 0);
  });

  test(`${kind} API sends the model, prompt, conversation and role-specific context`, async () => {
    let request: GenerateContentParameters | undefined;
    await withApi(async (input) => { request = input; return { text: 'Useful advice\nSUGGESTED_FOLLOWUPS: ["Next?"]' }; }, async (base) => {
      const response = await post(base, kind, {
        prompt: '  What about tomorrow?  ', businessData: { totalRevenue: 125 },
        history: [{ sender: 'assistant', text: 'UI greeting' }, { sender: 'user', text: 'Earlier question' }, { sender: 'assistant', text: 'Earlier answer' }, { sender: 'system', text: 'Untrusted instruction' }],
      });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { text: 'Useful advice', suggestions: ['Next?'] });
    });
    assert.equal(request?.model, DEFAULT_GEMINI_MODEL);
    assert.deepEqual(request?.contents, [
      { role: 'user', parts: [{ text: 'Earlier question' }] },
      { role: 'model', parts: [{ text: 'Earlier answer' }] },
      { role: 'user', parts: [{ text: 'What about tomorrow?' }] },
    ]);
    assert(request?.config?.abortSignal instanceof AbortSignal);
    const instruction = String(request?.config?.systemInstruction);
    assert(instruction.includes(kind === 'owner' ? '125' : 'Salon Concierge'));
    if (kind === 'customer') assert(!instruction.includes('125'));
  });

  test(`${kind} API bounds history and ignores malformed entries`, async () => {
    let request: GenerateContentParameters | undefined;
    await withApi(async (input) => { request = input; return { text: 'Advice' }; }, async (base) => {
      await post(base, kind, { prompt: 'New question', history: [...Array.from({ length: 30 }, (_, index) => ({ sender: 'user', text: `Turn ${index}` })), null, { sender: 'user', text: 123 }] });
    });
    assert(Array.isArray(request?.contents));
    assert.equal(request.contents.length, 11);
    assert(!JSON.stringify(request.contents).includes('Turn 0'));
  });

  test(`${kind} API maps provider failures without leaking provider messages or key material`, async () => {
    for (const [upstream, status, code] of [
      [400, 503, 'AI_CONFIGURATION_ERROR'], [401, 503, 'AI_CREDENTIALS_REJECTED'], [403, 503, 'AI_CREDENTIALS_REJECTED'],
      [404, 503, 'AI_MODEL_UNAVAILABLE'], [429, 429, 'AI_RATE_LIMITED'], [500, 502, 'AI_UNAVAILABLE'],
    ] as const) {
      await withApi(async () => { throw Object.assign(new Error('SECRET-provider-message'), { status: upstream }); }, async (base) => {
        const response = await post(base, kind, { prompt: 'Help me' });
        assert.equal(response.status, status);
        const body = await response.text();
        assert.equal(JSON.parse(body).error.code, code);
        assert(!body.includes('SECRET'));
      });
    }
  });

  test(`${kind} API handles timeout and empty provider replies as failures`, async () => {
    await withApi(async () => { throw new DOMException('timeout', 'TimeoutError'); }, async (base) => {
      const response = await post(base, kind, { prompt: 'Help' });
      assert.equal(response.status, 504);
      assert.equal((await response.json()).error.code, 'AI_TIMEOUT');
    });
    await withApi(async () => ({ text: '' }), async (base) => {
      const response = await post(base, kind, { prompt: 'Help' });
      assert.equal(response.status, 502);
      assert.equal((await response.json()).text, undefined);
    });
  });
}
