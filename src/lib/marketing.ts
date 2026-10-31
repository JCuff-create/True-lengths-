export const MARKETING_SEGMENTS = [
  'All Customers',
  'Inactive Clients (8+ Weeks)',
  'Silk Press Enthusiasts',
  'Custom Color & Balayage Clients',
  'VIP Gold Members',
] as const;

export type MarketingSegment = typeof MARKETING_SEGMENTS[number];
export type MarketingCampaign = { campaignId: string; segment: MarketingSegment; title: string; message: string };
export type MarketingReceipt = { delivered: number; channel: 'in-app'; replayed: boolean };
export type MarketingChannel = 'in-app' | 'instagram' | 'sms' | 'email';
export type MarketingDraft = MarketingCampaign & { channel: MarketingChannel; delivered: number | null };
export const MARKETING_TEMPLATES: { name: string; segment: MarketingSegment; title: string; message: string }[] = [
  { name: 'Book a visit', segment: 'All Customers', title: 'Make time for your next salon visit', message: 'Ready for your next moment of care? Explore the True Lengths service menu and choose an available appointment in the app. We look forward to welcoming you.' },
  { name: 'Welcome back', segment: 'Inactive Clients (8+ Weeks)', title: 'Your next chapter of healthy hair', message: 'We would love to welcome you back to True Lengths. From a fresh style to a nourishing treatment, find the care that fits your needs. Open the app to explore services and book your next visit.' },
  { name: 'Silk press care', segment: 'Silk Press Enthusiasts', title: 'Care for your silk press between visits', message: 'Keep your silk press looking its best with gentle wrapping at night and protection from moisture. Ready for personalized care? Explore our services and book your next True Lengths appointment in the app.' },
  { name: 'Gold members', segment: 'VIP Gold Members', title: 'A moment of care for our Gold members', message: 'Thank you for being part of the True Lengths community. Make time for your next salon visit: explore services and choose an available appointment in the app.' },
];

export function createMarketingDraft(): MarketingDraft {
  const { segment, title, message } = MARKETING_TEMPLATES[0];
  return { campaignId: crypto.randomUUID(), channel: 'in-app', segment, title, message, delivered: null };
}

type DraftStorage = Pick<Storage, 'getItem' | 'setItem'>;
const draftKey = (uid: string) => `truelengths:marketing-draft:${uid}`;
export function loadMarketingDraft(storage: DraftStorage, uid: string): MarketingDraft | null {
  try {
    const value = JSON.parse(storage.getItem(draftKey(uid)) || 'null');
    if (!value || value.version !== 1 || typeof value.campaignId !== 'string' || !/^[a-f0-9-]{36}$/i.test(value.campaignId) ||
      !MARKETING_SEGMENTS.includes(value.segment) || !['in-app', 'instagram', 'sms', 'email'].includes(value.channel) ||
      typeof value.title !== 'string' || value.title.length > 120 || typeof value.message !== 'string' || value.message.length > 4000 ||
      !(value.delivered === null || (Number.isSafeInteger(value.delivered) && value.delivered > 0))) return null;
    return { campaignId: value.campaignId, channel: value.channel, segment: value.segment, title: value.title, message: value.message, delivered: value.delivered };
  } catch { return null; }
}

export function saveMarketingDraft(storage: DraftStorage, uid: string, draft: MarketingDraft): boolean {
  try { storage.setItem(draftKey(uid), JSON.stringify({ ...draft, version: 1 })); return true; }
  catch { return false; }
}

export function marketingDraftText(draft: MarketingDraft): string {
  return `${draft.title}\n\n${draft.message}\n\nAudience: ${draft.segment}\nChannel: ${draft.channel}\n`;
}

export async function requestMarketingCopy(input: { segment: MarketingSegment; channel: MarketingChannel; title: string }, token: string, fetcher: typeof fetch = fetch): Promise<string> {
  let response: Response;
  try {
    response = await fetcher('/api/marketing/copy', { method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(input), signal: AbortSignal.timeout(35000) });
  } catch { throw new Error('AI copy could not be generated. Your draft was kept; check your connection and try again.'); }
  let data: { message?: unknown; error?: unknown };
  try { data = await response.json(); } catch { throw new Error('The copy generator is unavailable. Your draft was kept.'); }
  if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'AI copy could not be generated. Your draft was kept.');
  if (typeof data?.message !== 'string' || !data.message.trim() || data.message.length > 4000) throw new Error('The copy generator returned an invalid draft. Your previous draft was kept.');
  return data.message.trim();
}
type Customer = { id: string; role?: string; status?: string; salonId?: string; loyaltyTier?: string };
type Visit = { customerId?: string; status?: string; date?: string; serviceName?: string; salonId?: string };

export function campaignRecipients(customers: Customer[], visits: Visit[], salonId: string, segment: MarketingSegment, now = new Date()): string[] {
  const cutoff = now.getTime() - 56 * 24 * 60 * 60 * 1000;
  return customers.filter((customer) => {
    if (customer.role !== 'customer' || (customer.status && customer.status !== 'active') ||
      (customer.salonId || 'truelengths-main') !== salonId) return false;
    const completed = visits.filter((visit) => visit.customerId === customer.id && visit.status === 'completed' &&
      (visit.salonId || 'truelengths-main') === salonId && typeof visit.date === 'string' &&
      Number.isFinite(Date.parse(visit.date)) && Date.parse(visit.date) <= now.getTime());
    switch (segment) {
      case 'All Customers': return true;
      case 'Inactive Clients (8+ Weeks)': return completed.length > 0 && Math.max(...completed.map((visit) => Date.parse(visit.date!))) <= cutoff;
      case 'Silk Press Enthusiasts': return completed.some((visit) => /silk\s*press/i.test(visit.serviceName || ''));
      case 'Custom Color & Balayage Clients': return completed.some((visit) => /color|balayage/i.test(visit.serviceName || ''));
      case 'VIP Gold Members': return customer.loyaltyTier === 'Gold';
      default: return false;
    }
  }).map((customer) => customer.id);
}

export async function requestMarketing(action: 'preview' | 'send', campaign: MarketingCampaign, token: string, fetcher: typeof fetch = fetch): Promise<MarketingReceipt> {
  const response = await fetcher(`/api/marketing/${action}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(campaign), signal: AbortSignal.timeout(35000),
  });
  let data: { delivered?: number; channel?: string; replayed?: boolean; error?: string };
  try { data = await response.json(); } catch { throw new Error('Marketing is unavailable. No delivery was confirmed.'); }
  if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Campaign delivery was not confirmed. Please try again.');
  if (!data || !Number.isSafeInteger(data.delivered) || data.delivered! < 0 || data.channel !== 'in-app') {
    throw new Error('Campaign delivery was not confirmed. Please try again.');
  }
  return { delivered: data.delivered!, channel: 'in-app', replayed: data.replayed === true };
}
