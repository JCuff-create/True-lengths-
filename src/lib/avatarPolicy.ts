export const DEFAULT_SALON_ID = 'truelengths-main';
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type AvatarContentType = (typeof ALLOWED_AVATAR_TYPES)[number];

export type UserRoleRecord = {
  role?: unknown;
  status?: unknown;
  salonId?: unknown;
} | null | undefined;

export function normalizeAvatarContentType(contentType: string | null | undefined): string {
  return String(contentType || '').split(';')[0].trim().toLowerCase();
}

export function isAllowedAvatarContentType(contentType: string): contentType is AvatarContentType {
  return (ALLOWED_AVATAR_TYPES as readonly string[]).includes(contentType);
}

export type AvatarPayloadDecision =
  | { ok: true; contentType: AvatarContentType }
  | { ok: false; status: 400 | 413 | 415; error: string };

export function validateAvatarPayload(input: {
  contentType: string | null | undefined;
  byteLength: number;
}): AvatarPayloadDecision {
  const contentType = normalizeAvatarContentType(input.contentType);
  if (!isAllowedAvatarContentType(contentType)) {
    return { ok: false, status: 415, error: 'Choose a JPG, PNG, or WebP image.' };
  }
  if (!Number.isFinite(input.byteLength) || input.byteLength <= 0) {
    return { ok: false, status: 400, error: 'The selected image is empty.' };
  }
  if (input.byteLength > MAX_AVATAR_BYTES) {
    return { ok: false, status: 413, error: 'Profile pictures must be 5 MB or smaller.' };
  }
  return { ok: true, contentType };
}

export function validateAvatarFile(file: { size: number; type: string }): string | null {
  const decision = validateAvatarPayload({ contentType: file.type, byteLength: file.size });
  return 'error' in decision ? decision.error : null;
}

/** Profiles created before salon IDs were stored belong to the original tenant. */
export function salonIdOf(record: UserRoleRecord): string {
  if (!record || record.salonId == null) return DEFAULT_SALON_ID;
  const value = String(record.salonId).trim();
  return value || DEFAULT_SALON_ID;
}

export function isSafeAvatarUid(uid: string): boolean {
  return uid.length > 0
    && uid.length <= 128
    && !uid.includes('..')
    && !uid.includes('/')
    && !uid.includes('\\')
    && !uid.includes('\0');
}

export type AvatarAuthDecision =
  | { ok: true }
  | { ok: false; status: 403 | 404; error: string };

export function authorizeAvatarUpload(input: {
  actorUid: string;
  targetUid: string;
  actor: UserRoleRecord;
  target: UserRoleRecord;
  targetExists: boolean;
}): AvatarAuthDecision {
  if (input.actorUid && input.actorUid === input.targetUid) {
    return { ok: true };
  }

  const actor = input.actor;
  if (!actor || actor.role !== 'owner' || actor.status !== 'active') {
    return {
      ok: false,
      status: 403,
      error: 'Only an active salon owner can update another profile picture.',
    };
  }

  if (!input.targetExists || input.target?.role !== 'stylist') {
    return { ok: false, status: 404, error: 'Stylist profile not found.' };
  }

  if (salonIdOf(actor) !== salonIdOf(input.target)) {
    return { ok: false, status: 403, error: 'This stylist belongs to a different salon.' };
  }

  return { ok: true };
}

export function avatarObjectPath(targetUid: string): string {
  return `users/${targetUid}/avatar`;
}

/** Firebase download-token URL. Unlike a signed URL, it does not expire. */
export function buildFirebaseDownloadUrl(bucket: string, objectPath: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media&token=${encodeURIComponent(token)}`;
}

export function mergeDownloadTokens(existing: string | null | undefined, nextToken: string): string {
  const previous = String(existing || '')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(-1);
  return [...previous, nextToken].join(',');
}
