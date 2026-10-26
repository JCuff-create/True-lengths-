import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PASSWORD_RESET_SENT_MESSAGE,
  submitPasswordReset,
  validatePasswordResetEmail,
} from '../src/lib/passwordReset';

test('rejects an empty or invalid reset email before any request', async () => {
  assert.equal(validatePasswordResetEmail(''), 'Enter the email address for your account.');
  assert.equal(validatePasswordResetEmail('   '), 'Enter the email address for your account.');
  assert.equal(validatePasswordResetEmail('not-an-email'), 'Enter a valid email address.');
  assert.equal(validatePasswordResetEmail('a@b'), 'Enter a valid email address.');

  let calls = 0;
  const result = await submitPasswordReset('not-an-email', async () => {
    calls += 1;
  });
  assert.equal(calls, 0);
  assert.deepEqual(result, { status: 'invalid', message: 'Enter a valid email address.' });
});

test('sends a trimmed email and always confirms without revealing registration', async () => {
  const sent: string[] = [];
  const result = await submitPasswordReset('  member@example.com  ', async (email) => {
    sent.push(email);
  });
  assert.deepEqual(sent, ['member@example.com']);
  assert.equal(result.status, 'sent');
  assert.equal(result.message, PASSWORD_RESET_SENT_MESSAGE);
  assert.equal(
    result.message,
    'If an account exists for this email, a password-reset message has been sent.'
  );
});

test('uses the same confirmation when Firebase reports no account or a disabled account', async () => {
  for (const code of ['auth/user-not-found', 'auth/user-disabled', 'auth/invalid-credential']) {
    const result = await submitPasswordReset('member@example.com', async () => {
      throw { code, message: `There is no user record corresponding to member@example.com (${code})` };
    });
    assert.equal(result.status, 'sent');
    assert.equal(result.message, PASSWORD_RESET_SENT_MESSAGE);
    assert.equal(result.message.includes('member@example.com'), false);
    assert.equal(result.message.toLowerCase().includes('no user'), false);
  }
});

test('maps Firebase failures to safe messages and hides raw errors', async () => {
  const invalid = await submitPasswordReset('member@example.com', async () => {
    throw { code: 'auth/invalid-email', message: 'The email address is badly formatted.' };
  });
  assert.deepEqual(invalid, { status: 'error', message: 'Enter a valid email address.' });

  const limited = await submitPasswordReset('member@example.com', async () => {
    throw { code: 'auth/too-many-requests', message: 'Too many attempts for member@example.com' };
  });
  assert.equal(limited.status, 'error');
  assert.equal(limited.message, 'Too many attempts. Please wait a moment and try again.');
  assert.equal(limited.message.includes('member@example.com'), false);

  const offline = await submitPasswordReset('member@example.com', async () => {
    throw { code: 'auth/network-request-failed', message: 'network down' };
  });
  assert.equal(
    offline.message,
    'Unable to send the reset message. Check your connection and try again.'
  );

  const unknown = await submitPasswordReset('member@example.com', async () => {
    throw new Error('Firebase token abc123 leaked for member@example.com');
  });
  assert.deepEqual(unknown, {
    status: 'error',
    message: 'Unable to send the reset message. Please try again.',
  });
});
