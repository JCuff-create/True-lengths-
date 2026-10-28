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
