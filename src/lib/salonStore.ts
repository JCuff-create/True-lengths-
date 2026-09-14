import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Appointment,
  GalleryItem,
  GiftCard,
  HairFormula,
  InventoryItem,
  LoyaltyReward,
  RevenueMetric,
  Service,
  Stylist,
  AppNotification,
  UserProfile,
  UserRole,
} from '../types';

export const DEFAULT_SALON_ID = 'truelengths-main';

/** Top-level business collections used by the salon OS */
export const SALON_COLLECTIONS = {
  services: 'services',
  stylists: 'stylists',
  appointments: 'appointments',
  gallery: 'gallery',
  inventory: 'inventory',
  formulas: 'formulas',
  loyaltyRewards: 'loyaltyRewards',
  giftCards: 'giftCards',
  notifications: 'notifications',
} as const;

export type SalonCollection = (typeof SALON_COLLECTIONS)[keyof typeof SALON_COLLECTIONS];

export const EMPTY_METRICS: RevenueMetric = {
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
};

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export async function upsertSalonDoc(
  collectionName: SalonCollection,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const ref = doc(db, collectionName, id);
  await setDoc(
    ref,
    {
      ...stripUndefined(data),
      id,
      salonId: DEFAULT_SALON_ID,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deleteSalonDoc(collectionName: SalonCollection, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

export function subscribeSalonCollection<T extends { id: string }>(
  collectionName: SalonCollection,
  onData: (items: T[]) => void,
  onError?: (err: Error) => void,
  constraints: QueryConstraint[] = []
): Unsubscribe {
  const colRef = collection(db, collectionName);
  const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
  return onSnapshot(
    q,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((snap) => {
        const raw = snap.data() as Record<string, unknown>;
        items.push({ ...raw, id: snap.id } as T);
      });
      onData(items);
    },
    (err) => {
      console.warn(`Firestore ${collectionName} listener:`, err.message);
      onError?.(err);
    }
  );
}

export function appointmentConstraintsForRole(
  role: UserRole,
  uid: string
): QueryConstraint[] {
  if (role === 'customer') {
    return [where('customerId', '==', uid)];
  }
  return [];
}

export function giftCardConstraintsForRole(role: UserRole, uid: string): QueryConstraint[] {
  if (role === 'owner') return [];
  return [where('createdByUid', '==', uid)];
}

export function notificationConstraintsForRole(role: UserRole): QueryConstraint[] {
  if (role === 'owner') return [];
  return [where('targetRole', 'in', [role, 'all'])];
}

/** Derive dashboard metrics from live appointments — never seed fake KPIs */
export function computeMetricsFromAppointments(
  appointments: Appointment[],
  customerCount: number
): RevenueMetric {
  const completed = appointments.filter((a) => a.status === 'completed');
  const active = appointments.filter((a) => a.status !== 'canceled');
  const totalRevenue = completed.reduce((sum, a) => sum + (a.price || 0), 0);

  const byService = new Map<string, { revenue: number; count: number }>();
  for (const a of completed) {
    const cur = byService.get(a.serviceName) || { revenue: 0, count: 0 };
    cur.revenue += a.price || 0;
    cur.count += 1;
    byService.set(a.serviceName, cur);
  }
  const serviceRows = Array.from(byService.entries())
    .map(([name, v]) => ({ name, revenue: v.revenue, count: v.count }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const maxRev = serviceRows[0]?.revenue || 1;
  const topServices = serviceRows.map((s) => ({
    name: s.name,
    revenue: s.revenue,
    percentage: Math.round((s.revenue / maxRev) * 100),
  }));

  const monthMap = new Map<string, { revenue: number; appointments: number }>();
  for (const a of completed) {
    const month = (a.date || '').slice(0, 7) || 'unknown';
    const cur = monthMap.get(month) || { revenue: 0, appointments: 0 };
    cur.revenue += a.price || 0;
    cur.appointments += 1;
    monthMap.set(month, cur);
  }
  const monthlyBreakdown = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, v]) => ({
      month,
      revenue: v.revenue,
      appointments: v.appointments,
    }));

  const returning = new Set(
    appointments.filter((a) => a.status === 'completed').map((a) => a.customerId)
  );

  return {
    totalRevenue,
    revenueGrowth: 0,
    totalAppointments: active.length,
    appointmentsGrowth: 0,
    newClients: customerCount,
    newClientsGrowth: 0,
    retentionRate: customerCount > 0 ? Math.round((returning.size / customerCount) * 100) : 0,
    retentionGrowth: 0,
    topServices,
    monthlyBreakdown,
  };
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type SalonDataBundle = {
  services: Service[];
  stylists: Stylist[];
  appointments: Appointment[];
  gallery: GalleryItem[];
  inventory: InventoryItem[];
  formulas: HairFormula[];
  loyaltyRewards: LoyaltyReward[];
  giftCards: GiftCard[];
  notifications: AppNotification[];
};

export const EMPTY_SALON_DATA: SalonDataBundle = {
  services: [],
  stylists: [],
  appointments: [],
  gallery: [],
  inventory: [],
  formulas: [],
  loyaltyRewards: [],
  giftCards: [],
  notifications: [],
};

/** Clear legacy browser-only demo keys from older builds */
export function clearLegacyLocalDemoData(): void {
  const keys = [
    'truelengths_stylists',
    'truelengths_appointments',
    'truelengths_gallery',
    'truelengths_inventory',
    'truelengths_customer_profiles',
    'truelengths_active_cust_id',
    'tl_demo_user',
  ];
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

export type { UserProfile };
