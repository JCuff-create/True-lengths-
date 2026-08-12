/**
 * Production data starts empty. All salon records are loaded from Firestore.
 * This module remains only so older imports fail loudly if reintroduced.
 */
export const INITIAL_CUSTOMER_PROFILES = [] as const;
export const INITIAL_SERVICES = [] as const;
export const INITIAL_STYLISTS = [] as const;
export const INITIAL_APPOINTMENTS = [] as const;
export const INITIAL_FORMULAS = [] as const;
export const INITIAL_GALLERY = [] as const;
export const INITIAL_INVENTORY = [] as const;
export const INITIAL_REVENUE_METRICS = {
  totalRevenue: 0,
  revenueGrowth: 0,
  totalAppointments: 0,
  appointmentsGrowth: 0,
  newClients: 0,
  newClientsGrowth: 0,
  retentionRate: 0,
  retentionGrowth: 0,
  topServices: [],
  monthlyBreakdown: [],
} as const;
export const INITIAL_LOYALTY_REWARDS = [] as const;
export const INITIAL_GIFT_CARDS = [] as const;
export const INITIAL_REVIEWS = [] as const;
export const INITIAL_NOTIFICATIONS = [] as const;
