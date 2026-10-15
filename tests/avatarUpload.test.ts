import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import express from 'express';
import {
  MAX_AVATAR_BYTES,
  isValidAvatarUrl,
  validateAvatarFile,
} from '../src/lib/avatarUpload';
import {
  DEFAULT_SALON_ID as policySalonId,
  buildFirebaseDownloadUrl,
  mergeDownloadTokens,
  salonIdOf,
} from '../src/lib/avatarPolicy';
import { avatarUploadHandlers, type AvatarUploadDeps } from '../src/lib/avatarRoute';
import { DEFAULT_SALON_ID as storeSalonId } from '../src/lib/salonStore';

type UserDoc = { role?: string; status?: string; salonId?: string };

type AvatarResponse = {
  status: number;
  payload: { ok?: boolean; avatar?: string; error?: string } | null;
};

async function postAvatar(
  deps: AvatarUploadDeps,
  input: {
    targetUid: string;
    token?: string;
    contentType?: string;
    body?: Buffer;
  }
): Promise<AvatarResponse> {
  const app = express();
  app.post('/api/users/:targetUid/avatar', ...avatarUploadHandlers(deps));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const { port } = server.address() as AddressInfo;
    const headers: Record<string, string> = {};
    if (input.token) headers.Authorization = `Bearer ${input.token}`;
    if (input.contentType) headers['Content-Type'] = input.contentType;
    const response = await fetch(
      `http://127.0.0.1:${port}/api/users/${encodeURIComponent(input.targetUid)}/avatar`,
      {
        method: 'POST',
        headers,
        body: input.body ?? Buffer.alloc(0),
      }
    );
    const payload = await response.json().catch(() => null);
    return { status: response.status, payload };
  } finally {
    server.close();
    await once(server, 'close');
  }
}

function uploadDeps(options: {
  uid: string;
  records?: Record<string, UserDoc | null>;
  avatar?: string;
  onLoad?: () => void;
  onUpload?: (input: { targetUid: string; body: Buffer; contentType: string }) => void;
}): AvatarUploadDeps {
  return {
    verifyIdToken: async (token) => {
      if (token !== 'good-token') throw new Error('invalid token');
      return { uid: options.uid };
    },
    loadUser: async (uid) => {
      options.onLoad?.();
      const data = options.records?.[uid];
      if (!data) return { exists: false, data: null };
      return { exists: true, data };
    },
    upload: async (input) => {
      options.onUpload?.(input);
      return options.avatar ?? `https://firebasestorage.googleapis.com/v0/b/bucket/o/users%2F${input.targetUid}%2Favatar?alt=media&token=durable`;
    },
  };
}

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

test('keeps the legacy salon fallback aligned', () => {
  assert.equal(policySalonId, 'truelengths-main');
  assert.equal(policySalonId, storeSalonId);
  assert.equal(salonIdOf(null), 'truelengths-main');
  assert.equal(salonIdOf({}), 'truelengths-main');
  assert.equal(salonIdOf({ salonId: '  ' }), 'truelengths-main');
  assert.equal(salonIdOf({ salonId: 'other-salon' }), 'other-salon');
});

test('builds a durable Firebase download-token URL', () => {
  const url = buildFirebaseDownloadUrl(
    'massive-ridge-298sv.firebasestorage.app',
    'users/abc/avatar',
    '11111111-1111-1111-1111-111111111111'
  );
  assert.equal(
    url,
    'https://firebasestorage.googleapis.com/v0/b/massive-ridge-298sv.firebasestorage.app/o/users%2Fabc%2Favatar?alt=media&token=11111111-1111-1111-1111-111111111111'
  );
  assert.equal(url.includes('X-Goog-Expires'), false);
  assert.equal(url.includes('GoogleAccessId'), false);
  assert.equal(mergeDownloadTokens(undefined, 'new-token'), 'new-token');
  assert.equal(mergeDownloadTokens('older,previous', 'new-token'), 'previous,new-token');
});

test('storage rules do not read the named Firestore database', () => {
  const rules = readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');
  assert.equal(rules.includes('firestore.get'), false);
  assert.equal(rules.includes('firestore.exists'), false);
  assert.equal(rules.includes('ai-studio-truelengthssalon'), false);
  assert.match(rules, /request\.auth\.uid == userId/);
  assert.match(rules, /allow read, write: if false/);
  assert.equal(rules.includes('isActiveOwnerForStylist'), false);
});

test('allows a user to upload their own avatar', async () => {
  let loads = 0;
  let uploaded: { targetUid: string; body: Buffer; contentType: string } | null = null;
  const avatar = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/users%2Fuser-1%2Favatar?alt=media&token=self';
  for (const contentType of ['image/jpeg', 'image/png', 'image/webp'] as const) {
    const result = await postAvatar(
      uploadDeps({
        uid: 'user-1',
        avatar,
        onLoad: () => {
          loads += 1;
        },
        onUpload: (input) => {
          uploaded = input;
        },
      }),
      {
        targetUid: 'user-1',
        token: 'good-token',
        contentType,
        body: Buffer.from([1, 2, 3, 4]),
      }
    );
    assert.equal(result.status, 200);
    assert.deepEqual(result.payload, { ok: true, avatar });
    assert.equal(uploaded?.targetUid, 'user-1');
    assert.equal(uploaded?.contentType, contentType);
    assert.equal(uploaded?.body.equals(Buffer.from([1, 2, 3, 4])), true);
  }
  assert.equal(loads, 0);
});

test('allows an active owner to upload for a same-salon stylist', async () => {
  let uploaded = false;
  const result = await postAvatar(
    uploadDeps({
      uid: 'owner-1',
      records: {
        'owner-1': { role: 'owner', status: 'active', salonId: 'truelengths-main' },
        'stylist-1': { role: 'stylist', status: 'disabled', salonId: 'truelengths-main' },
      },
      onUpload: () => {
        uploaded = true;
      },
    }),
    {
      targetUid: 'stylist-1',
      token: 'good-token',
      contentType: 'image/webp',
      body: Buffer.from([1, 2, 3]),
    }
  );
  assert.equal(result.status, 200);
  assert.equal(result.payload?.ok, true);
  assert.equal(uploaded, true);
});

test('missing salonId falls back to truelengths-main', async () => {
  const allowed = await postAvatar(
    uploadDeps({
      uid: 'owner-1',
      records: {
        'owner-1': { role: 'owner', status: 'active' },
        'stylist-1': { role: 'stylist', status: 'active', salonId: '' },
      },
    }),
    {
      targetUid: 'stylist-1',
      token: 'good-token',
      contentType: 'image/jpeg',
      body: Buffer.from([9]),
    }
  );
  assert.equal(allowed.status, 200);

  const rejected = await postAvatar(
    uploadDeps({
      uid: 'owner-1',
      records: {
        'owner-1': { role: 'owner', status: 'active' },
        'stylist-2': { role: 'stylist', status: 'active', salonId: 'other-salon' },
      },
    }),
    {
      targetUid: 'stylist-2',
      token: 'good-token',
      contentType: 'image/jpeg',
      body: Buffer.from([9]),
    }
  );
  assert.equal(rejected.status, 403);
  assert.match(rejected.payload?.error || '', /different salon/);
});

test('rejects an owner upload when the target is not a stylist', async () => {
  for (const target of [
    { role: 'customer', status: 'active', salonId: 'truelengths-main' },
    { role: 'owner', status: 'active', salonId: 'truelengths-main' },
    null,
  ]) {
    let uploaded = false;
    const result = await postAvatar(
      uploadDeps({
        uid: 'owner-1',
        records: {
          'owner-1': { role: 'owner', status: 'active', salonId: 'truelengths-main' },
          'target-1': target,
        },
        onUpload: () => {
          uploaded = true;
        },
      }),
      {
        targetUid: 'target-1',
        token: 'good-token',
        contentType: 'image/jpeg',
        body: Buffer.from([1]),
      }
    );
    assert.equal(result.status, 404);
    assert.match(result.payload?.error || '', /Stylist profile not found/);
    assert.equal(uploaded, false);
  }
});

test('rejects an owner upload for a stylist in a different salon', async () => {
  let uploaded = false;
  const result = await postAvatar(
    uploadDeps({
      uid: 'owner-1',
      records: {
        'owner-1': { role: 'owner', status: 'active', salonId: 'truelengths-main' },
        'stylist-2': { role: 'stylist', status: 'active', salonId: 'other-salon' },
      },
      onUpload: () => {
        uploaded = true;
      },
    }),
    {
      targetUid: 'stylist-2',
      token: 'good-token',
      contentType: 'image/jpeg',
      body: Buffer.from([1]),
    }
  );
  assert.equal(result.status, 403);
  assert.match(result.payload?.error || '', /different salon/);
  assert.equal(uploaded, false);
});

test('rejects inactive and non-owner uploads for another user', async () => {
  const target = { 'stylist-1': { role: 'stylist', status: 'active', salonId: 'truelengths-main' } };
  const actors: Array<UserDoc | null> = [
    { role: 'owner', status: 'disabled', salonId: 'truelengths-main' },
    { role: 'owner', status: 'pending', salonId: 'truelengths-main' },
    { role: 'stylist', status: 'active', salonId: 'truelengths-main' },
    { role: 'customer', status: 'active', salonId: 'truelengths-main' },
    null,
  ];

  for (const actor of actors) {
    let uploaded = false;
    const result = await postAvatar(
      uploadDeps({
        uid: 'actor-1',
        records: { 'actor-1': actor, ...target },
        onUpload: () => {
          uploaded = true;
        },
      }),
      {
        targetUid: 'stylist-1',
        token: 'good-token',
        contentType: 'image/png',
        body: Buffer.from([1, 2]),
      }
    );
    assert.equal(result.status, 403);
    assert.match(result.payload?.error || '', /active salon owner/);
    assert.equal(uploaded, false);
  }
});

test('rejects unsupported content types and empty files', async () => {
  const deps = uploadDeps({ uid: 'user-1' });
  const gif = await postAvatar(deps, {
    targetUid: 'user-1',
    token: 'good-token',
    contentType: 'image/gif',
    body: Buffer.from([1, 2, 3]),
  });
  assert.equal(gif.status, 415);
  assert.match(gif.payload?.error || '', /JPG, PNG, or WebP/);

  const empty = await postAvatar(deps, {
    targetUid: 'user-1',
    token: 'good-token',
    contentType: 'image/jpeg',
    body: Buffer.alloc(0),
  });
  assert.equal(empty.status, 400);
  assert.match(empty.payload?.error || '', /empty/);
});

test('rejects files over 5 MB and accepts a file at the limit', async () => {
  const exact = await postAvatar(uploadDeps({ uid: 'user-1' }), {
    targetUid: 'user-1',
    token: 'good-token',
    contentType: 'image/jpeg',
    body: Buffer.alloc(MAX_AVATAR_BYTES, 7),
  });
  assert.equal(exact.status, 200);
  assert.equal(exact.payload?.ok, true);

  let uploaded = false;
  const oversized = await postAvatar(
    uploadDeps({
      uid: 'user-1',
      onUpload: () => {
        uploaded = true;
      },
    }),
    {
      targetUid: 'user-1',
      token: 'good-token',
      contentType: 'image/jpeg',
      body: Buffer.alloc(MAX_AVATAR_BYTES + 1, 7),
    }
  );
  assert.equal(oversized.status, 413);
  assert.match(oversized.payload?.error || '', /5 MB/);
  assert.equal(uploaded, false);
});
