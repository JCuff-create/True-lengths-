import { auth } from './firebase';

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

type AvatarFileLike = Pick<File, 'size' | 'type'>;

export function validateAvatarFile(file: AvatarFileLike): string | null {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
    return 'Choose a JPG, PNG, or WebP image.';
  }

  if (file.size <= 0) return 'The selected image is empty.';
  if (file.size > MAX_AVATAR_BYTES) return 'Profile pictures must be 5 MB or smaller.';
  return null;
}

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
  if (!uid) throw new Error('Sign in again before uploading a profile picture.');
  if (!auth.currentUser) throw new Error('Sign in again before uploading a profile picture.');

  const token = await auth.currentUser.getIdToken();
  const response = await fetch(`/api/users/${encodeURIComponent(uid)}/avatar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': file.type,
    },
    body: file,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || 'Profile picture upload failed. Please retry.');
  }
  if (!isValidAvatarUrl(result.avatar)) {
    throw new Error('The profile picture uploaded, but no valid image URL was returned.');
  }

  const separator = result.avatar.includes('?') ? '&' : '?';
  return `${result.avatar}${separator}v=${Date.now()}`;
}
