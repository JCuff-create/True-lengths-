import type { RequestHandler } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
import { campaignRecipients, MARKETING_SEGMENTS, type MarketingSegment } from '../lib/marketing';

export function createMarketingHandler(options: {
  db: Firestore;
  verifyToken: (token: string) => Promise<{ uid: string }>;
  preview: boolean;
}): RequestHandler {
  return async (req, res) => {
    const token = req.header('authorization')?.match(/^Bearer (\S+)$/)?.[1];
    if (!token) { res.status(401).json({ error: 'Sign in as the salon owner to send a campaign.' }); return; }
    let uid: string;
    try { ({ uid } = await options.verifyToken(token)); }
    catch { res.status(401).json({ error: 'Your session expired. Sign in again.' }); return; }
    try {
      const profile = (await options.db.doc(`users/${uid}`).get()).data();
      if (profile?.role !== 'owner' || profile.status !== 'active') {
        res.status(403).json({ error: 'Only an active salon owner can send campaigns.' }); return;
      }
      const { campaignId, segment, title, message } = req.body || {};
      if (typeof campaignId !== 'string' || !/^[a-f0-9-]{36}$/i.test(campaignId) ||
        !MARKETING_SEGMENTS.includes(segment) || typeof title !== 'string' || !title.trim() || title.trim().length > 120 ||
        typeof message !== 'string' || !message.trim() || message.trim().length > 4000) {
        res.status(400).json({ error: 'Choose a customer segment, a title up to 120 characters, and a message up to 4,000 characters.' }); return;
      }
      const salonId = profile.salonId || 'truelengths-main';
      const digest = createHash('sha256').update(JSON.stringify([salonId, segment, title.trim(), message.trim()])).digest('hex');
      const campaignRef = options.db.doc(`marketingCampaigns/${uid}_${campaignId}`);
      // Check the receipt before resolving the audience: a retry must not add newly registered customers.
      const previous = (await campaignRef.get()).data();
      if (!options.preview && previous) {
        if (previous.digest !== digest) { res.status(409).json({ error: 'This campaign was already sent with different content. Start a new campaign.' }); return; }
        res.json({ delivered: previous.delivered, channel: 'in-app', replayed: true }); return;
      }
      const customers = await options.db.collection('users').where('role', '==', 'customer').get();
      const needsVisits = !['All Customers', 'VIP Gold Members'].includes(segment);
      const visits = needsVisits ? await options.db.collection('appointments').where('status', '==', 'completed').get() : null;
      const recipients = campaignRecipients(customers.docs.map((doc) => ({ ...doc.data(), id: doc.id })),
        visits?.docs.map((doc) => doc.data()) || [], salonId, segment as MarketingSegment);
      if (recipients.length > 450) {
        res.status(400).json({ error: 'This audience exceeds 450 customers. Choose a smaller segment; nothing was sent.' }); return;
      }
      if (options.preview) { res.json({ delivered: recipients.length, channel: 'in-app', replayed: false }); return; }
      if (!recipients.length) { res.status(409).json({ error: 'No eligible customers match this segment. Nothing was sent.' }); return; }
      const receipt = await options.db.runTransaction(async (transaction) => {
        const existing = (await transaction.get(campaignRef)).data();
        if (existing) {
          if (existing.digest !== digest) return null;
          return { delivered: existing.delivered, channel: 'in-app', replayed: true };
        }
        const timestamp = new Date().toISOString();
        for (const recipientUid of recipients) {
          const ref = options.db.doc(`users/${recipientUid}/notifications/${campaignId}`);
          transaction.create(ref, { id: campaignId, campaignId, recipientUid, salonId, title: title.trim(),
            message: message.trim(), timestamp, read: false, type: 'general', targetRole: 'customer' });
        }
        transaction.create(campaignRef, { digest, salonId, createdByUid: uid, timestamp, delivered: recipients.length, channel: 'in-app' });
        return { delivered: recipients.length, channel: 'in-app', replayed: false };
      });
      if (!receipt) { res.status(409).json({ error: 'This campaign was already sent with different content. Start a new campaign.' }); return; }
      res.json(receipt);
    } catch {
      console.error('Marketing delivery failed');
      res.status(500).json({ error: 'Campaign delivery was not confirmed. Retry the same campaign to avoid duplicates.' });
    }
  };
}
