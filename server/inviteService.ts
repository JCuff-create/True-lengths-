import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { loadFirebaseConfig, verifyActiveOwner, type VerifiedIdentity } from './authRole';

const firebaseConfig = loadFirebaseConfig();

export type InviteRecord = {
  id: string;
  createdByUid: string;
  createdByEmail: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'revoked' | 'used';
  usedByUid?: string;
  usedAt?: string;
};

type InviteStoreFile = {
  invites: InviteRecord[];
};

export type VerifiedOwner = Pick<VerifiedIdentity, 'uid' | 'email'>;

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const STORE_PATH = path.join(process.cwd(), '.data', 'stylist-invites.json');

function getInviteSecret(): string {
  const secret = process.env.STYLIST_INVITE_SECRET || process.env.INVITE_HMAC_SECRET || '';
  if (!secret) {
    console.warn(
      '[invites] STYLIST_INVITE_SECRET is not set. Using a project-derived fallback. Set STYLIST_INVITE_SECRET for production.'
    );
    return `tl-invite-fallback:${firebaseConfig.projectId}:${firebaseConfig.appId}`;
  }
  return secret;
}

/** Owner-only gate — role resolved from /owners/{uid}, never from the browser */
export async function verifyOwnerIdToken(idToken: string): Promise<VerifiedOwner> {
  const identity = await verifyActiveOwner(idToken);
  return { uid: identity.uid, email: identity.email };
}

function ensureStore(): InviteStoreFile {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as InviteStoreFile;
      if (Array.isArray(parsed.invites)) return parsed;
    }
  } catch (err) {
    console.warn('[invites] Failed to read invite store, recreating:', err);
  }
  return { invites: [] };
}

function saveStore(store: InviteStoreFile) {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Compact signed invite: TL1.<payload>.<hmac> — secret never leaves the server */
function signInviteCode(id: string, expMs: number): string {
  const payload = Buffer.from(JSON.stringify({ id, exp: expMs }), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getInviteSecret()).update(payload).digest('base64url');
  return `TL1.${payload}.${sig}`;
}

function parseSignedInviteCode(
  code: string
): { id: string; exp: number } | { error: string } {
  const trimmed = (code || '').trim();
  const parts = trimmed.split('.');
  if (parts.length !== 3 || parts[0] !== 'TL1') {
    return { error: 'Invalid invite code.' };
  }
  const [, payload, sig] = parts;
  const expected = crypto.createHmac('sha256', getInviteSecret()).update(payload).digest('base64url');
  if (!timingSafeEqualStr(sig, expected)) {
    return { error: 'Invalid invite code.' };
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      id?: string;
      exp?: number;
    };
    if (!data.id || typeof data.exp !== 'number') {
      return { error: 'Invalid invite code.' };
    }
    return { id: data.id, exp: data.exp };
  } catch {
    return { error: 'Invalid invite code.' };
  }
}

export function createStylistInvite(owner: VerifiedOwner, ttlMs = DEFAULT_TTL_MS): {
  code: string;
  invite: InviteRecord;
} {
  const store = ensureStore();
  const now = Date.now();
  const id = crypto.randomUUID();
  const expiresAtMs = now + ttlMs;
  const invite: InviteRecord = {
    id,
    createdByUid: owner.uid,
    createdByEmail: owner.email,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(expiresAtMs).toISOString(),
    status: 'active',
  };
  store.invites.unshift(invite);
  saveStore(store);

  const code = signInviteCode(id, expiresAtMs);
  return { code, invite };
}

export function listStylistInvites(): InviteRecord[] {
  const store = ensureStore();
  const now = Date.now();
  let dirty = false;
  const result = store.invites.map((inv) => {
    if (inv.status === 'active' && new Date(inv.expiresAt).getTime() < now) {
      dirty = true;
      return { ...inv, status: 'revoked' as const };
    }
    return inv;
  });
  if (dirty) {
    store.invites = result;
    saveStore(store);
  }
  return result;
}

export function revokeStylistInvite(inviteId: string, _owner: VerifiedOwner): InviteRecord {
  const store = ensureStore();
  const inv = store.invites.find((i) => i.id === inviteId);
  if (!inv) {
    throw Object.assign(new Error('Invitation not found.'), { status: 404 });
  }
  inv.status = 'revoked';
  saveStore(store);
  return inv;
}

export function revokeAllActiveInvites(_owner: VerifiedOwner): number {
  const store = ensureStore();
  let count = 0;
  for (const inv of store.invites) {
    if (inv.status === 'active') {
      inv.status = 'revoked';
      count += 1;
    }
  }
  saveStore(store);
  return count;
}

export function validateStylistInviteCode(
  code: string
): { valid: true; inviteId: string } | { valid: false; reason: string } {
  const parsed = parseSignedInviteCode(code);
  if ('error' in parsed) return { valid: false, reason: parsed.error };
  if (parsed.exp < Date.now()) {
    return { valid: false, reason: 'This invite has expired.' };
  }

  const store = ensureStore();
  const inv = store.invites.find((i) => i.id === parsed.id);
  if (inv) {
    if (inv.status === 'revoked') return { valid: false, reason: 'This invite has been revoked.' };
    if (inv.status === 'used') return { valid: false, reason: 'This invite has already been used.' };
  }
  // Signed + unexpired + not revoked/used in local store
  return { valid: true, inviteId: parsed.id };
}

export function consumeStylistInvite(
  code: string,
  usedByUid: string
): { ok: true; inviteId: string } | { ok: false; reason: string } {
  const check = validateStylistInviteCode(code);
  if (check.valid === false) return { ok: false, reason: check.reason };

  const store = ensureStore();
  let inv = store.invites.find((i) => i.id === check.inviteId);
  if (!inv) {
    // Persist a used marker so the same signed code cannot be reused on this instance
    const parsed = parseSignedInviteCode(code);
    if ('error' in parsed) return { ok: false, reason: parsed.error };
    inv = {
      id: parsed.id,
      createdByUid: 'unknown',
      createdByEmail: 'unknown',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(parsed.exp).toISOString(),
      status: 'used',
      usedByUid,
      usedAt: new Date().toISOString(),
    };
    store.invites.unshift(inv);
  } else {
    if (inv.status !== 'active') {
      return { ok: false, reason: 'Invite is no longer active.' };
    }
    inv.status = 'used';
    inv.usedByUid = usedByUid;
    inv.usedAt = new Date().toISOString();
  }
  saveStore(store);
  return { ok: true, inviteId: inv.id };
}
