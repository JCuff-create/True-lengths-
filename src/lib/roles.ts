import { UserRole, UserStatus } from '../types';

/** Portal views a signed-in user may open based on Firestore role + status. */
export function allowedPortalRoles(
  role: UserRole | undefined,
  status: UserStatus | undefined
): UserRole[] {
  if (!role || status === 'disabled' || status === 'pending') return [];
  if (role === 'customer' && status === 'active') return ['customer'];
  if (role === 'stylist' && status === 'active') return ['customer', 'stylist'];
  if (role === 'owner' && status === 'active') return ['customer', 'stylist', 'owner'];
  return [];
}

export function canAccessPortal(
  actualRole: UserRole | undefined,
  status: UserStatus | undefined,
  requestedPortal: UserRole
): boolean {
  return allowedPortalRoles(actualRole, status).includes(requestedPortal);
}

export function defaultPortalForRole(role: UserRole): UserRole {
  return role;
}

export function defaultViewForPortal(portal: UserRole): string {
  if (portal === 'stylist') return 'stylist_schedule';
  if (portal === 'owner') return 'owner_dashboard';
  return 'home';
}

const CUSTOMER_VIEWS = new Set([
  'home',
  'booking',
  'appointments',
  'assistant',
  'gallery',
  'loyalty',
]);
const STYLIST_VIEWS = new Set(['stylist_schedule', 'formulas']);
const OWNER_VIEWS = new Set([
  'owner_dashboard',
  'portfolio',
  'owner_calendar',
  'inventory',
  'marketing',
  'owner_ai',
]);

export function isViewAllowedForPortal(portal: UserRole, view: string): boolean {
  if (portal === 'customer') return CUSTOMER_VIEWS.has(view);
  if (portal === 'stylist') return STYLIST_VIEWS.has(view);
  if (portal === 'owner') return OWNER_VIEWS.has(view);
  return false;
}
