import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

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

  const avatarRef = ref(storage, `users/${uid}/avatar`);
  await uploadBytes(avatarRef, file, {
    contentType: file.type,
    cacheControl: 'public,max-age=300',
  });

  const downloadUrl = await getDownloadURL(avatarRef);
  const separator = downloadUrl.includes('?') ? '&' : '?';
  return `${downloadUrl}${separator}v=${Date.now()}`;
}
