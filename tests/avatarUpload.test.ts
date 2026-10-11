import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_AVATAR_BYTES,
  isValidAvatarUrl,
  validateAvatarFile,
} from '../src/lib/avatarUpload';

test('accepts supported images at or below the upload limit', () => {
  assert.equal(validateAvatarFile({ type: 'image/jpeg', size: 100_000 }), null);
  assert.equal(validateAvatarFile({ type: 'image/png', size: MAX_AVATAR_BYTES }), null);
  assert.equal(validateAvatarFile({ type: 'image/webp', size: 1 }), null);
});

test('rejects unsupported, empty, and oversized files', () => {
  assert.match(validateAvatarFile({ type: 'image/gif', size: 100 }) || '', /JPG, PNG, or WebP/);
  assert.match(validateAvatarFile({ type: 'image/jpeg', size: 0 }) || '', /empty/);
  assert.match(
    validateAvatarFile({ type: 'image/jpeg', size: MAX_AVATAR_BYTES + 1 }) || '',
    /5 MB/
  );
});

test('accepts only empty or web avatar URLs', () => {
  assert.equal(isValidAvatarUrl(''), true);
  assert.equal(isValidAvatarUrl('https://example.com/avatar.jpg'), true);
  assert.equal(isValidAvatarUrl('http://example.com/avatar.jpg'), true);
  assert.equal(isValidAvatarUrl('data:image/jpeg;base64,abc'), false);
  assert.equal(isValidAvatarUrl('not-a-url'), false);
});
