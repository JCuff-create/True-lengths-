import { UserRole } from '../types';

/** Views allowed inside each permanently assigned portal */
export const PORTAL_VIEWS: Record<UserRole, readonly string[]> = {
  customer: ['home', 'booking', 'appointments', 'assistant', 'gallery', 'loyalty'],
  stylist: ['stylist_schedule', 'formulas'],
  owner: [
    'owner_dashboard',
    'portfolio',
    'owner_calendar',
    'inventory',
    'marketing',
    'owner_ai',
  ],
} as const;

export const PORTAL_HOME: Record<UserRole, string> = {
  customer: 'home',
  stylist: 'stylist_schedule',
  owner: 'owner_dashboard',
};

export const VALID_ROLES: readonly UserRole[] = ['customer', 'stylist', 'owner'];

export function isValidRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (VALID_ROLES as readonly string[]).includes(value);
}

export function defaultViewForRole(role: UserRole): string {
  return PORTAL_HOME[role];
}

export function isViewAllowedForRole(role: UserRole, view: string): boolean {
  return (PORTAL_VIEWS[role] as readonly string[]).includes(view);
}

/** Map hash like `#/owner/inventory` -> { role, view } */
export function parsePortalHash(hash: string): { role: UserRole; view: string } | null {
  const raw = hash.replace(/^#\/?/, '').trim();
  if (!raw) return null;
  const [rolePart, viewPart] = raw.split('/');
  if (!isValidRole(rolePart)) return null;
  const view = viewPart || defaultViewForRole(rolePart);
  return { role: rolePart, view };
}

export function buildPortalHash(role: UserRole, view: string): string {
  const safeView = isViewAllowedForRole(role, view) ? view : defaultViewForRole(role);
  return `#/${role}/${safeView}`;
}

/**
 * Profile deep-links: `#/customer/profile`, `#/stylist/profile/{uid}`, `#/owner/profile/{uid}`
 * Returns null if the hash is not a profile path.
 */
export function parseProfileHash(
  hash: string
): { portalRole: UserRole; profileRole: UserRole; profileUid?: string } | null {
  const raw = hash.replace(/^#\/?/, '').trim();
  const parts = raw.split('/').filter(Boolean);
  if (parts.length < 2 || parts[1] !== 'profile') return null;
  if (!isValidRole(parts[0])) return null;
  const profileRole = isValidRole(parts[2]) ? parts[2] : parts[0];
  const profileUid = isValidRole(parts[2]) ? parts[3] : parts[2];
  return { portalRole: parts[0], profileRole, profileUid };
}

/** Owner bootstrap email — only this identity may self-create an owner profile */
export const OWNER_BOOTSTRAP_EMAIL = 'carolyn.owner@truelengths.com';