import { createHash } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';

export const AI_MAX_OUTPUT_TOKENS = 1024;
export const AI_MAX_CONTENT_BYTES = 18000;
export const AI_MAX_SYSTEM_BYTES = 6000;
export class AiAccessError extends Error {
  constructor(public status: number, public code: string, message: string, public retryAfter?: number) { super(message); }
}
export type AiActor = { uid: string; salonId: string; role: 'customer' | 'stylist' | 'owner' };
export type AiLimits = {
  userPerMinute: number; salonPerMinute: number; userPerDay: number; salonPerDay: number;
  userDailyUnits: number; salonDailyUnits: number; requestTimeoutMs: number;
};
export function aiLimits(env: Record<string, string | undefined>): AiLimits {
  const read = (key: string, fallback: number, maximum = 100000000) => {
    const raw = env[key];
    if (raw === undefined) return fallback;
    const value = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < 1 || value > maximum) throw new Error(`Invalid server setting: ${key}`);
    return value;
  };
  return {
    userPerMinute: read('AI_USER_REQUESTS_PER_MINUTE', 6), salonPerMinute: read('AI_SALON_REQUESTS_PER_MINUTE', 60),
    userPerDay: read('AI_USER_REQUESTS_PER_DAY', 50), salonPerDay: read('AI_SALON_REQUESTS_PER_DAY', 500),
    userDailyUnits: read('AI_USER_UNITS_PER_DAY', 500000), salonDailyUnits: read('AI_SALON_UNITS_PER_DAY', 5000000),
    requestTimeoutMs: read('AI_REQUEST_TIMEOUT_MS', 30000, 30000),
  };
}
export type AiAccess = {
  timeoutMs: number;
  authorize: (authorization: string | undefined, ownerOnly: boolean, signal: AbortSignal) => Promise<AiActor>;
  reserve: (actor: AiActor, units: number, signal: AbortSignal) => Promise<void>;
  businessData: (actor: AiActor, signal: AbortSignal) => Promise<Record<string, unknown>>;
};

// Race the entire operation, including auth, database work and a provider that ignores aborts.
export async function withAiDeadline<T>(work: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new AiAccessError(504, 'AI_TIMEOUT', 'The AI request took too long. Please try again.')); }, timeoutMs);
  });
  try { return await Promise.race([work(controller.signal), timeout]); }
  finally { clearTimeout(timer!); controller.abort(); }
}

export function createAiAccess(options: {
  db: Firestore; verifyToken: (token: string) => Promise<{ uid: string }>;
  limits?: AiLimits; now?: () => number;
}): AiAccess {
  const limits = options.limits || aiLimits(process.env);
  const now = options.now || Date.now;
  const profileActor = (uid: string, data: Record<string, unknown> | undefined): AiActor => {
    // Missing statuses are supported only for legacy customer profiles.
    if (!data || !['customer', 'stylist', 'owner'].includes(String(data.role)) ||
      !(data.status === 'active' || (data.role === 'customer' && data.status === undefined))) {
      throw new AiAccessError(403, 'AI_ACCESS_DENIED', 'Your account does not have access to the AI service.');
    }
    const salonId = data.salonId === undefined ? 'truelengths-main' : data.salonId;
    if (typeof salonId !== 'string' || !salonId.trim() || salonId.length > 128 || salonId.includes('/')) {
      throw new AiAccessError(403, 'AI_ACCESS_DENIED', 'Your salon membership could not be verified.');
    }
    return { uid, salonId, role: data.role as AiActor['role'] };
  };
  const hash = (value: string) => createHash('sha256').update(value).digest('hex');
  return {
    timeoutMs: limits.requestTimeoutMs,
    async authorize(authorization, ownerOnly, signal) {
      const token = authorization?.match(/^Bearer (\S+)$/)?.[1];
      if (!token) throw new AiAccessError(401, 'AI_AUTH_REQUIRED', 'Sign in to use the AI assistant.');
      let uid: string;
      try { ({ uid } = await options.verifyToken(token)); }
      catch { throw new AiAccessError(401, 'AI_AUTH_REQUIRED', 'Your session expired. Sign in again.'); }
      signal.throwIfAborted();
      if (typeof uid !== 'string' || !uid || uid.includes('/')) throw new AiAccessError(401, 'AI_AUTH_REQUIRED', 'Sign in again.');
      const actor = profileActor(uid, (await options.db.doc(`users/${uid}`).get()).data());
      signal.throwIfAborted();
      if (ownerOnly && actor.role !== 'owner') throw new AiAccessError(403, 'AI_OWNER_REQUIRED', 'Only an active salon owner can use this feature.');
      return actor;
    },
    async reserve(actor, units, signal) {
      if (!Number.isSafeInteger(units) || units < 1 || units > AI_MAX_CONTENT_BYTES + AI_MAX_SYSTEM_BYTES + AI_MAX_OUTPUT_TOKENS) {
        throw new AiAccessError(413, 'AI_INPUT_TOO_LARGE', 'This conversation is too long. Start a new chat.');
      }
      signal.throwIfAborted();
      const time = now();
      const minute = Math.floor(time / 60000);
      const day = new Date(time).toISOString().slice(0, 10);
      const dayRetry = Math.max(1, Math.ceil((Date.parse(`${day}T00:00:00Z`) + 86400000 - time) / 1000));
      const minuteRetry = Math.max(1, Math.ceil(((minute + 1) * 60000 - time) / 1000));
      const buckets = [
        { key: `user_${hash(actor.uid)}_m_${minute}`, cap: limits.userPerMinute, retry: minuteRetry, daily: false, unitCap: Infinity },
        { key: `salon_${hash(actor.salonId)}_m_${minute}`, cap: limits.salonPerMinute, retry: minuteRetry, daily: false, unitCap: Infinity },
        { key: `user_${hash(actor.uid)}_d_${day}`, cap: limits.userPerDay, retry: dayRetry, daily: true, unitCap: limits.userDailyUnits },
        { key: `salon_${hash(actor.salonId)}_d_${day}`, cap: limits.salonPerDay, retry: dayRetry, daily: true, unitCap: limits.salonDailyUnits },
      ];
      await options.db.runTransaction(async (transaction) => {
        const refs = buckets.map((bucket) => options.db.doc(`aiUsage/${bucket.key}`));
        const [profile, ...snapshots] = await transaction.getAll(options.db.doc(`users/${actor.uid}`), ...refs);
        signal.throwIfAborted();
        const current = profileActor(actor.uid, profile.data());
        if (current.role !== actor.role || current.salonId !== actor.salonId) throw new AiAccessError(403, 'AI_ACCESS_DENIED', 'Your permissions changed. Refresh and try again.');
        const counts = snapshots.map((snapshot) => {
          const data = snapshot.data();
          const requests = data?.requests ?? 0;
          const usedUnits = data?.units ?? 0;
          if (![requests, usedUnits].every((value) => Number.isSafeInteger(value) && value >= 0)) throw new Error('Invalid usage counter');
          return { requests, units: usedUnits };
        });
        buckets.forEach((bucket, index) => {
          const used = counts[index];
          if (used.requests >= bucket.cap || (bucket.daily && used.units + units > bucket.unitCap)) {
            throw new AiAccessError(429, bucket.daily ? 'AI_QUOTA_EXHAUSTED' : 'AI_RATE_LIMITED',
              bucket.daily ? 'Your user or salon daily AI allowance is exhausted. Try again after midnight UTC.' : 'Your user or salon AI request limit was reached. Please wait and try again.', bucket.retry);
          }
        });
        signal.throwIfAborted();
        buckets.forEach((bucket, index) => transaction.set(refs[index], {
          requests: counts[index].requests + 1, units: counts[index].units + (bucket.daily ? units : 0),
          expiresAt: new Date(bucket.daily ? Date.parse(`${day}T00:00:00Z`) + 172800000 : time + 86400000),
        }));
      }, { maxAttempts: 5 });
      signal.throwIfAborted();
    },
    async businessData(actor, signal) {
      if (actor.role !== 'owner') throw new AiAccessError(403, 'AI_OWNER_REQUIRED', 'Owner access is required.');
      signal.throwIfAborted();
      const snapshot = await options.db.collection('appointments').where('salonId', '==', actor.salonId)
        .select('status', 'price', 'serviceName', 'date').limit(1001).get();
      signal.throwIfAborted();
      if (snapshot.size > 1000) throw new AiAccessError(503, 'AI_DATA_LIMIT', 'This salon has more appointment records than this analysis supports. Please contact support.');
      const records = snapshot.docs.map((doc) => doc.data());
      const completed = records.filter((record) => record.status === 'completed');
      const price = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1000000 ? value : 0;
      const services = new Map<string, { revenue: number; count: number }>();
      for (const record of completed) {
        const name = typeof record.serviceName === 'string' ? record.serviceName.slice(0, 100) : 'Unspecified service';
        const row = services.get(name) || { revenue: 0, count: 0 };
        row.revenue += price(record.price); row.count++; services.set(name, row);
      }
      return {
        source: 'Server Firestore query restricted to the verified owner salon',
        totalRevenue: completed.reduce((sum, record) => sum + price(record.price), 0), completedAppointments: completed.length,
        totalAppointments: records.filter((record) => ['completed', 'upcoming', 'in_progress'].includes(record.status)).length,
        topServices: [...services.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5).map(([name, row]) => ({ name, ...row })),
      };
    },
  };
}
