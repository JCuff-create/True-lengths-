import assert from 'node:assert/strict';
import test from 'node:test';
import { AssistantRequestError, requestAssistant as authenticatedRequest } from '../src/lib/assistantClient';
const requestAssistant = (kind: Parameters<typeof authenticatedRequest>[0], input: Parameters<typeof authenticatedRequest>[1], fetcher: typeof fetch) =>
  authenticatedRequest(kind, input, fetcher, async () => 'fixture-token');

for (const kind of ['customer', 'owner'] as const) {
  test(`${kind} chat client posts history and only accepts a real successful reply`, async () => {
    let sent: unknown;
    const result = await requestAssistant(kind, { prompt: 'Hello', history: [] }, async (url, init) => {
      assert.equal(url, `/api/ai/${kind}-assistant`);
      assert.equal(init?.method, 'POST');
      assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer fixture-token');
      assert(init?.signal instanceof AbortSignal);
      sent = JSON.parse(String(init?.body));
      return Response.json({ text: 'Advice', suggestions: ['Next?', 123, null] });
    });
    assert.deepEqual(sent, { prompt: 'Hello', history: [] });
    assert.deepEqual(result, { text: 'Advice', suggestions: ['Next?'] });
  });

  test(`${kind} chat client rejects HTTP errors instead of displaying fake assistant replies`, async () => {
    await assert.rejects(requestAssistant(kind, { prompt: 'Help', history: [] }, async () =>
      Response.json({ text: 'Do not show this fallback', error: { code: 'AI_NOT_CONFIGURED', message: 'Not connected yet' } }, { status: 503 })),
    (error: unknown) => error instanceof AssistantRequestError && error.code === 'AI_NOT_CONFIGURED' && error.message === 'Not connected yet');
    await assert.rejects(requestAssistant(kind, { prompt: 'Help', history: [] }, async () =>
      Response.json({ error: 'RAW SECRET: never display' }, { status: 500 })),
    (error: unknown) => error instanceof AssistantRequestError && !error.message.includes('SECRET'));
  });

  test(`${kind} chat client handles HTML/static-host responses, null JSON and empty replies`, async () => {
    for (const response of [new Response('<html>Vite app</html>'), Response.json(null), Response.json({}), Response.json({ text: ' ' })]) {
      await assert.rejects(requestAssistant(kind, { prompt: 'Help', history: [] }, async () => response),
        (error: unknown) => error instanceof AssistantRequestError && error.code === 'AI_INVALID_RESPONSE');
    }
  });

  test(`${kind} chat client handles connection failure and timeout`, async () => {
    for (const [failure, code] of [[new TypeError('Failed to fetch'), 'AI_NETWORK_ERROR'], [new DOMException('timed out', 'TimeoutError'), 'AI_TIMEOUT']] as const) {
      await assert.rejects(requestAssistant(kind, { prompt: 'Help', history: [] }, async () => { throw failure; }),
        (error: unknown) => error instanceof AssistantRequestError && error.code === code);
    }
  });
}

test('chat never sends an anonymous request or client-supplied business metrics', async () => {
  let calls = 0;
  const fetcher: typeof fetch = async (_url, init) => {
    calls++;
    assert.equal(JSON.parse(String(init?.body)).businessData, undefined);
    return Response.json({ text: 'Server metrics', suggestions: [] });
  };
  await assert.rejects(authenticatedRequest('owner', { prompt: 'Test', history: [] }, fetcher, async () => ''),
    (error: unknown) => error instanceof AssistantRequestError && error.code === 'AI_AUTH_REQUIRED');
  assert.equal(calls, 0);
  const input = { prompt: 'Test', history: [], businessData: { totalRevenue: 999999 } };
  await authenticatedRequest('owner', input, fetcher, async () => 'fixture-token');
  assert.equal(calls, 1);
});
