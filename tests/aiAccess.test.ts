import assert from 'node:assert/strict';
import test from 'node:test';
import { aiLimits, AiAccessError, withAiDeadline } from '../src/server/aiAccess';

test('AI limits default to finite caps and reject disabled, malformed or unbounded configuration', () => {
  const limits = aiLimits({});
  assert.equal(limits.userPerMinute, 6);
  assert.equal(limits.salonPerDay, 500);
  assert.equal(limits.requestTimeoutMs, 30000);
  for (const value of ['0', '-1', 'Infinity', 'NaN', '', '1.5', '100000001']) {
    assert.throws(() => aiLimits({ AI_USER_REQUESTS_PER_DAY: value }), /Invalid server setting/);
  }
  assert.throws(() => aiLimits({ AI_REQUEST_TIMEOUT_MS: '30001' }));
  assert.equal(aiLimits({ AI_USER_REQUESTS_PER_DAY: '3' }).userPerDay, 3);
});

test('AI deadline aborts and stops waiting even when the underlying operation ignores cancellation', async () => {
  let signal: AbortSignal | undefined;
  await assert.rejects(withAiDeadline(async (value) => { signal = value; return new Promise<never>(() => {}); }, 20),
    (error: unknown) => error instanceof AiAccessError && error.status === 504 && error.code === 'AI_TIMEOUT');
  assert.equal(signal?.aborted, true);
});
