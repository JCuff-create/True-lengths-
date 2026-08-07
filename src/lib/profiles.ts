import { UserProfile, UserRole, UserStatus } from '../types';
import { isValidRole, OWNER_BOOTSTRAP_EMAIL } from './roles';

export const DEFAULT_SALON_ID = 'truelengths-main';

/** Role-separated Firestore collections — membership implies role */
export const PROFILE_COLLECTIONS = {
  customer: 'customers',
  stylist: 'stylists',
  owner: 'owners',
} as const;

export type ProfileCollection = (typeof PROFILE_COLLECTIONS)[UserRole];

export function collectionForRole(role: UserRole): ProfileCollection {
  return PROFILE_COLLECTIONS[role];
}

export function roleFromCollection(collection: string): UserRole | null {
  if (collection === 'customers') return 'customer';
  if (collection === 'stylists') return 'stylist';
  if (collection === 'owners') return 'owner';
  return null;
}

/** Fields a user may edit on their own profile (never role/status/salonId) */
export const PERSONAL_PROFILE_FIELDS = [
  'name',
  'phone',
  'avatar',
  'hairType',
  'notes',
  'email',
  'loyaltyPoints',
  'loyaltyTier',
  'memberSince',
  'updatedAt',
] as const;

export const LOCKED_ADMIN_FIELDS = ['role', 'status', 'salonId', 'uid', 'id'] as const;

export function mapProfileDoc(
  uid: string,
  email: string,
  role: UserRole,
  data: Record<string, unknown>
): UserProfile {
  return {
    id: uid,
    uid,
    name: (data.name as string) || email.split('@')[0],
    email: (data.email as string) || email,
    role,
    status: (data.status as UserStatus) || (role === 'stylist' ? 'pending' : 'active'),
    salonId: (data.salonId as string) || DEFAULT_SALON_ID,
    avatar:
      (data.avatar as string) ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    phone: (data.phone as string) || '',
    hairType: (data.hairType as string) || '',
    loyaltyPoints: (data.loyaltyPoints as number) ?? (role === 'customer' ? 100 : undefined),
    loyaltyTier: (data.loyaltyTier as UserProfile['loyaltyTier']) || (role === 'customer' ? 'Gold' : undefined),
    memberSince: (data.memberSince as string) || '2024',
    notes: (data.notes as string) || '',
  };
}

/** Sanitize client updates — strip admin fields so role escalation is impossible from the UI */
export function sanitizePersonalProfileUpdate(
  current: UserProfile,
  incoming: Partial<UserProfile>
): UserProfile {
  return {
    ...current,
    name: incoming.name !== undefined ? String(incoming.name) : current.name,
    phone: incoming.phone !== undefined ? String(incoming.phone) : current.phone,
    avatar: incoming.avatar !== undefined ? String(incoming.avatar) : current.avatar,
    hairType: incoming.hairType !== undefined ? String(incoming.hairType) : current.hairType,
    notes: incoming.notes !== undefined ? String(incoming.notes) : current.notes,
    email: incoming.email !== undefined ? String(incoming.email) : current.email,
    loyaltyPoints:
      incoming.loyaltyPoints !== undefined ? incoming.loyaltyPoints : current.loyaltyPoints,
    loyaltyTier: incoming.loyaltyTier !== undefined ? incoming.loyaltyTier : current.loyaltyTier,
    memberSince: incoming.memberSince !== undefined ? incoming.memberSince : current.memberSince,
    // Locked:
    role: current.role,
    status: current.status,
    salonId: current.salonId,
    uid: current.uid,
    id: current.id,
  };
}

/**
 * Frontend authorization helper (defense in depth — Firestore + API also enforce).
 * Stylists can never access owner profiles.
 */
export function canAccessProfile(
  actorRole: UserRole,
  actorUid: string,
  actorStatus: UserStatus | undefined,
  targetRole: UserRole,
  targetUid: string
): boolean {
  if (actorStatus === 'disabled') return false;

  if (actorRole === 'owner' && actorStatus === 'active') return true;

  if (actorRole === 'stylist') {
    if (targetRole === 'owner') return false;
    if (actorStatus === 'pending') {
      return targetRole === 'stylist' && targetUid === actorUid;
    }
    if (actorStatus !== 'active') return false;
    return targetRole === 'customer' || targetRole === 'stylist';
  }

  if (actorRole === 'customer') {
    return targetRole === 'customer' && targetUid === actorUid;
  }

  return false;
}

export function isBootstrapOwnerEmail(email: string): boolean {
  return email.toLowerCase() === OWNER_BOOTSTRAP_EMAIL;
}

export { isValidRole, OWNER_BOOTSTRAP_EMAIL };
