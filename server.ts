import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  verifyOwnerIdToken,
  createStylistInvite,
  listStylistInvites,
  revokeStylistInvite,
  revokeAllActiveInvites,
  validateStylistInviteCode,
  consumeStylistInvite,
} from './server/inviteService';
import {
  verifyIdToken,
  verifyIdTokenAndRole,
  canReadProfile,
  fetchProfileByRole,
  type AuthRole,
} from './server/authRole';

const app = express();
// Cloud Run injects PORT (typically 8080). AI Studio preview / local default to 3000.
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Google GenAI SDK on the server side
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// -------------------------------------------------------------
// AI Customer Assistant Route
// -------------------------------------------------------------
app.post('/api/ai/customer-assistant', async (req, res) => {
  try {
    const { prompt, history } = req.body;

    if (!aiClient) {
      return res.json({
        text: "Welcome to True Lengths Virtual Salon Concierge! I'm your specialist for textured hair care (Types 3A-4C), silk presses, protective styles, loc care, and melanin-rich skin treatments. How can I assist your crown and skin care journey today?",
        suggestions: [
          "How do I care for my silk press in humidity?",
          "Best hydration routine for 4C hair?",
          "How often should I oil & wash knotless braids?",
          "Facial treatments for dark spots & hyperpigmentation?"
        ]
      });
    }

    const systemInstruction = `You are the True Lengths AI Salon Concierge — a warm, cultured, world-class expert consultant specializing in Black hair care, textured hair (Type 3A through 4C), Silk Presses, Protective Styles (Knotless Braids, Fulani Braids, Passion Twists), Locs (Starter locs, retwists, detox), Custom Balayage on textured hair, Microlinks, Scalp Barrier Health, and Melanin-Rich Skin Care.

Your Persona: Warm, empowering, culturally knowledgeable, refined, and empathetic. You celebrate textured hair versatility, healthy growth retention, curl pattern preservation, moisture balance, and radiant melanin skin care.

Key Salon Offerings & Expertise:
- Master Stylist & Founder: Carolyn R.
- Core Hair Services: Silk Press with Thermal Protection ($75+), Knotless Braids ($150+), Starter Locs & Retwists ($95+), Microlinks ($350+), Custom Balayage for Textured Hair ($180+), Protective Style Take-down ($60+).
- Scalp & Hair Treatments: Deep Steam Hydration Mask ($45+), Scalp Detox & Exfoliation ($55+), Rice Water Protein Therapy ($40+), Hot Oil Treatment ($35+).
- Melanin Skin Care & Esthetics: Gold Glow HydraFacial ($110+), Dark Spot & Hyperpigmentation Facial ($95+), Botanical Gentle Peel ($85+).
- Philosophy: Healthy hair retention over quick fixes, heat protection, tension-free styling, scalp barrier nourishing, and glowing melanin skin.

Answer user questions concisely in 2-3 warm, expert sentences with practical, actionable advice.
ALWAYS end your response with 3 logical, interactive follow-up questions tailored directly to Black hair care, protective styles, scalp health, or melanin skin care, formatted at the very end on a new line as:
SUGGESTED_FOLLOWUPS: ["Question 1", "Question 2", "Question 3"]`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const fullText = response.text || "Thank you for reaching out to True Lengths! How can I help customize your salon experience for your natural hair and skin?";
    
    let cleanText = fullText;
    let suggestions: string[] = [
      "How do I maintain my silk press in high humidity?",
      "What products prevent scalp itching in knotless braids?",
      "Which facial helps reduce hyperpigmentation and dark spots?"
    ];

    if (fullText.includes('SUGGESTED_FOLLOWUPS:')) {
      const parts = fullText.split('SUGGESTED_FOLLOWUPS:');
      cleanText = parts[0].trim();
      try {
        const parsed = JSON.parse(parts[1].trim());
        if (Array.isArray(parsed) && parsed.length > 0) {
          suggestions = parsed.map(s => String(s));
        }
      } catch (e) {
        console.log('Failed to parse suggested followups:', e);
      }
    }

    return res.json({ text: cleanText, suggestions });
  } catch (error: any) {
    console.error('Error in customer assistant API:', error);
    return res.status(500).json({
      text: "I'm temporarily experiencing a minor connectivity delay. I am here to help with silk press care, 4C hair hydration, knotless braid scalp care, loc retwists, and dark spot facials!",
      suggestions: [
        "Silk Press Anti-Humidity Care",
        "Knotless Braid Scalp Oil Routine",
        "Book Melanin Glow Facial"
      ],
      error: error.message
    });
  }
});

// -------------------------------------------------------------
// AI Owner/Business Assistant Route
// -------------------------------------------------------------
app.post('/api/ai/owner-assistant', async (req, res) => {
  try {
    const { prompt, businessData } = req.body;

    if (!aiClient) {
      return res.json({
        text: "I am your True Lengths AI Business Advisor. Currently running in offline analytics mode. Here is the operational analysis based on your current telemetry data.",
        suggestions: [
          "Who hasn't returned in 8 weeks?",
          "Which service yields highest margin?",
          "Draft SMS outreach for inactive clients"
        ]
      });
    }

    const systemInstruction = `You are True Lengths AI Executive Operations Advisor — an elite business intelligence partner for the salon owner.
You analyze revenue trends, stylist productivity, inventory stockouts, client retention rates, and local marketing strategies.
You speak like a seasoned business strategist and luxury brand director: clear, actionable, data-driven, and empowering.

Current Salon Metrics:
- Monthly Revenue: $24,350 (+12.5% MoM)
- Appointments Completed: 236
- Retention Rate: 68%
- Top Performers: Carolyn R. (Silk Press), Tina M. (Balayage), Maria S. (Braids)
- Low Stock Items: Silk Thermal Protectant Serum (4 remaining), Wella Illumina Color Gloss (2 remaining)
- 8-Week Inactive Clients: 14 clients due for Silk Press / Color refresh.

CRITICAL INSTRUCTION:
At the end of your response, you MUST provide exactly 3 relevant, actionable follow-up questions or next steps to keep the conversation going and help the owner explore deeper insights.
Format them at the very end of your output after a blank line as:
SUGGESTED_FOLLOWUPS: ["Follow-up option 1", "Follow-up option 2", "Follow-up option 3"]`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    const fullText = response.text || "Here is your business intelligence overview for True Lengths.";
    let cleanText = fullText;
    let suggestions: string[] = [
      "Draft re-engagement SMS for 8-week inactive clients",
      "Compare Carolyn R vs Tina M revenue contribution",
      "Which inventory items need immediate reorder?"
    ];

    if (fullText.includes('SUGGESTED_FOLLOWUPS:')) {
      const parts = fullText.split('SUGGESTED_FOLLOWUPS:');
      cleanText = parts[0].trim();
      try {
        const parsed = JSON.parse(parts[1].trim());
        if (Array.isArray(parsed) && parsed.length > 0) {
          suggestions = parsed.map(s => String(s));
        }
      } catch (e) {
        console.log('Failed to parse owner suggested followups:', e);
      }
    }

    return res.json({ text: cleanText, suggestions });
  } catch (error: any) {
    console.error('Error in owner assistant API:', error);
    return res.status(500).json({
      text: "Unable to process AI Business insights right now.",
      suggestions: [
        "Analyze 8-week inactive clients",
        "Predict inventory stockouts",
        "Show revenue breakdown by service"
      ],
      error: error.message
    });
  }
});

// Healthcheck API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', salon: 'True Lengths Salon OS', version: '1.0.0' });
});

// -------------------------------------------------------------
// Secure stylist invitations (server-side only — codes never shipped in the client bundle)
// -------------------------------------------------------------
app.post('/api/invites/stylist', async (req, res) => {
  try {
    const idToken = String(req.body?.idToken || req.headers.authorization?.replace(/^Bearer\s+/i, '') || '');
    const owner = await verifyOwnerIdToken(idToken);
    const { code, invite } = createStylistInvite(owner);
    // Plaintext code returned once to the authenticated owner; never logged
    res.status(201).json({
      code,
      invite,
      message: 'Share this invite privately with the stylist. It is shown only once.',
    });
  } catch (error: any) {
    const status = error.status || 500;
    console.error('[invites] create error:', error.message);
    res.status(status).json({ error: error.message || 'Failed to create invite.' });
  }
});

app.get('/api/invites/stylist', async (req, res) => {
  try {
    const idToken = String(req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.query.idToken || '');
    await verifyOwnerIdToken(idToken);
    res.json({ invites: listStylistInvites() });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to list invites.' });
  }
});

app.post('/api/invites/stylist/revoke', async (req, res) => {
  try {
    const idToken = String(req.body?.idToken || req.headers.authorization?.replace(/^Bearer\s+/i, '') || '');
    const owner = await verifyOwnerIdToken(idToken);
    if (req.body?.revokeAll) {
      const count = revokeAllActiveInvites(owner);
      return res.json({ revoked: count, message: `Revoked ${count} active invitation(s).` });
    }
    const inviteId = String(req.body?.inviteId || '');
    if (!inviteId) {
      return res.status(400).json({ error: 'inviteId is required (or set revokeAll: true).' });
    }
    const invite = revokeStylistInvite(inviteId, owner);
    res.json({ invite, message: 'Invitation revoked.' });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to revoke invite.' });
  }
});

app.post('/api/invites/stylist/regenerate', async (req, res) => {
  try {
    const idToken = String(req.body?.idToken || req.headers.authorization?.replace(/^Bearer\s+/i, '') || '');
    const owner = await verifyOwnerIdToken(idToken);
    revokeAllActiveInvites(owner);
    const { code, invite } = createStylistInvite(owner);
    res.status(201).json({
      code,
      invite,
      message: 'Previous active invites revoked. Share the new code privately.',
    });
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to regenerate invite.' });
  }
});

/** Public validate — does not reveal whether a code format is "close"; only valid/invalid */
app.post('/api/invites/stylist/validate', (req, res) => {
  try {
    const code = String(req.body?.code || '');
    const result = validateStylistInviteCode(code);
    if (result.valid === false) {
      return res.status(400).json({ valid: false, error: result.reason });
    }
    res.json({ valid: true, inviteId: result.inviteId });
  } catch (error: any) {
    res.status(500).json({ valid: false, error: error.message || 'Validation failed.' });
  }
});

// -------------------------------------------------------------
// Profile APIs — Firebase ID token + server-side role checks
// -------------------------------------------------------------
function extractIdToken(req: express.Request): string {
  return String(
    req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.body?.idToken || req.query.idToken || ''
  );
}

app.post('/api/invites/stylist/consume', async (req, res) => {
  try {
    const code = String(req.body?.code || '');
    const usedByUid = String(req.body?.uid || '');
    if (!usedByUid) {
      return res.status(400).json({ ok: false, error: 'uid is required.' });
    }
    // Bind invite consumption to the authenticated Firebase UID (profile may not exist yet)
    const authUser = await verifyIdToken(extractIdToken(req));
    if (authUser.uid !== usedByUid) {
      return res.status(403).json({
        ok: false,
        error: 'Invite can only be consumed by the authenticated user.',
      });
    }
    const result = consumeStylistInvite(code, usedByUid);
    if (result.ok === false) {
      return res.status(400).json({ ok: false, error: result.reason });
    }
    res.json({ ok: true, inviteId: result.inviteId });
  } catch (error: any) {
    res.status(error.status || 500).json({ ok: false, error: error.message || 'Failed to consume invite.' });
  }
});

app.get('/api/profiles/me', async (req, res) => {
  try {
    const identity = await verifyIdTokenAndRole(extractIdToken(req));
    res.json({
      uid: identity.uid,
      email: identity.email,
      role: identity.role,
      status: identity.status,
      collection: identity.collection,
      profile: {
        ...identity.profile,
        uid: identity.uid,
        role: identity.role,
        status: identity.status,
      },
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to load profile.' });
  }
});

app.get('/api/profiles/:role/:uid', async (req, res) => {
  try {
    const targetRole = req.params.role as AuthRole;
    const targetUid = req.params.uid;
    if (!['customer', 'stylist', 'owner'].includes(targetRole)) {
      return res.status(400).json({ error: 'Invalid profile role.' });
    }

    const identity = await verifyIdTokenAndRole(extractIdToken(req));
    if (!canReadProfile(identity, targetRole, targetUid)) {
      return res.status(403).json({
        error: 'Access denied: your role cannot view this profile.',
        actorRole: identity.role,
        targetRole,
      });
    }

    // Prefer actor's own cached profile when requesting self
    if (targetUid === identity.uid && targetRole === identity.role) {
      return res.json({
        uid: identity.uid,
        role: identity.role,
        status: identity.status,
        profile: { ...identity.profile, uid: identity.uid, role: identity.role },
      });
    }

    const profile = await fetchProfileByRole(extractIdToken(req), targetRole, targetUid);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    res.json({
      uid: targetUid,
      role: targetRole,
      status: profile.status || 'active',
      profile: { ...profile, uid: targetUid, role: targetRole },
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to load profile.' });
  }
});

/** Explicit deny probe used by security tests */
app.post('/api/profiles/access-check', async (req, res) => {
  try {
    const identity = await verifyIdTokenAndRole(extractIdToken(req));
    const targetRole = String(req.body?.targetRole || '') as AuthRole;
    const targetUid = String(req.body?.targetUid || '');
    if (!['customer', 'stylist', 'owner'].includes(targetRole) || !targetUid) {
      return res.status(400).json({ error: 'targetRole and targetUid are required.' });
    }
    const allowed = canReadProfile(identity, targetRole, targetUid);
    res.json({
      allowed,
      actorRole: identity.role,
      actorUid: identity.uid,
      targetRole,
      targetUid,
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Access check failed.' });
  }
});

// Vite Middleware for development / static server for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`True Lengths Salon OS server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
