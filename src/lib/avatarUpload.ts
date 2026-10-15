import { auth } from './firebase';
import {
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_BYTES,
  validateAvatarFile,
} from './avatarPolicy';

export { ALLOWED_AVATAR_TYPES, MAX_AVATAR_BYTES, validateAvatarFile };

export function isValidAvatarUrl(value: string): boolean {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const validationError = validateAvatarFile(file);
  if (validationError) throw new Error(validationError);

  const targetUid = uid.trim();
  const currentUser = auth.currentUser;
  if (!targetUid || !currentUser) {
    throw new Error('Sign in again before uploading a profile picture.');
  }

  // Storage Rules cannot read the named Firestore database, so salon checks
  // happen on the server. This token belongs to the signed-in user, who may
  // be an owner uploading on behalf of a stylist.
  const token = await currentUser.getIdToken();
  const response = await fetch(`/api/users/${encodeURIComponent(targetUid)}/avatar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': file.type,
    },
    body: file,
  });

  let payload: { ok?: boolean; avatar?: unknown; error?: unknown } | null = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.ok !== true || typeof payload.avatar !== 'string' || !payload.avatar) {
    const message = typeof payload?.error === 'string' && payload.error
      ? payload.error
      : 'Profile picture upload failed.';
    throw new Error(message);
  }

  return payload.avatar;
}
