import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { applicationDefault, getApps as getAdminApps, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import firebaseConfigJson from './firebase-applet-config.json';

const app = express();
// Cloud Run injects PORT (typically 8080). Local / AI Studio default to 3000.
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const adminApp = getAdminApps().length
  ? getAdminApps()[0]
  : initializeAdminApp({
      credential: applicationDefault(),
      projectId: firebaseConfigJson.projectId,
    });
const adminAuth = getAdminAuth(adminApp);
const adminDb = firebaseConfigJson.firestoreDatabaseId
  ? getAdminFirestore(adminApp, firebaseConfigJson.firestoreDatabaseId)
  : getAdminFirestore(adminApp);

function bearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith('Bearer ')) return null;
  return authorizationHeader.slice('Bearer '.length).trim();
}

// Permanent removal must run on the trusted server: client SDKs cannot delete
// another Firebase Authentication user. Historical appointments are retained.
app.post('/api/admin/stylists/permanent-remove', async (req, res) => {
  try {
    const token = bearerToken(req.header('authorization'));
    if (!token) return res.status(401).json({ error: 'Owner authentication is required.' });

    const decoded = await adminAuth.verifyIdToken(token);
    const ownerSnapshot = await adminDb.doc(`users/${decoded.uid}`).get();
    const owner = ownerSnapshot.data();
    if (!ownerSnapshot.exists || owner?.role !== 'owner' || owner?.status !== 'active') {
      return res.status(403).json({ error: 'Only an active salon owner can remove a stylist.' });
    }

    const targetUid = String(req.body?.targetUid || '').trim();
    const confirmationEmail = String(req.body?.confirmationEmail || '').trim().toLowerCase();
    if (!targetUid || targetUid === decoded.uid) {
      return res.status(400).json({ error: 'A valid stylist account is required.' });
    }

    const targetRef = adminDb.doc(`users/${targetUid}`);
    const targetSnapshot = await targetRef.get();
    const target = targetSnapshot.data();
    if (!targetSnapshot.exists || target?.role !== 'stylist') {
      return res.status(404).json({ error: 'Stylist profile not found.' });
    }
    if (target.salonId !== owner.salonId) {
      return res.status(403).json({ error: 'This stylist belongs to a different salon.' });
    }
    if (confirmationEmail !== String(target.email || '').trim().toLowerCase()) {
      return res.status(400).json({ error: 'The confirmation email does not match this stylist.' });
    }

    // Close access and booking visibility before deleting Authentication.
    const safetyBatch = adminDb.batch();
    safetyBatch.update(targetRef, {
      status: 'disabled',
      updatedAt: FieldValue.serverTimestamp(),
    });
    safetyBatch.set(adminDb.doc(`stylists/${targetUid}`), {
      active: false,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await safetyBatch.commit();

    try {
      await adminAuth.deleteUser(targetUid);
    } catch (error: any) {
      // Make retries safe if Auth deletion succeeded but Firestore cleanup did not.
      if (error?.code !== 'auth/user-not-found') throw error;
    }

    const inviteSnapshots = await adminDb
      .collection('staffInvites')
      .where('email', '==', String(target.email || '').trim().toLowerCase())
      .get();
    const cleanupBatch = adminDb.batch();
    cleanupBatch.delete(targetRef);
    cleanupBatch.delete(adminDb.doc(`stylists/${targetUid}`));
    inviteSnapshots.docs.forEach((invite) => cleanupBatch.delete(invite.ref));
    await cleanupBatch.commit();

    return res.json({
      ok: true,
      removedUid: targetUid,
      preservedAppointmentHistory: true,
    });
  } catch (error: any) {
    console.error('Permanent stylist removal failed:', error);
    return res.status(500).json({ error: 'Permanent removal failed. The stylist was left disabled for safety.' });
  }
});

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
      model: 'gemini-3.8-flash',
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

Current Salon Metrics (from live Firestore businessData — never invent numbers):
${JSON.stringify(businessData || {}, null, 2)}

If businessData is empty or zeroed, say that no completed appointments/revenue are recorded yet. Do not invent sample metrics.

CRITICAL INSTRUCTION:
At the end of your response, you MUST provide exactly 3 relevant, actionable follow-up questions or next steps to keep the conversation going and help the owner explore deeper insights.
Format them at the very end of your output after a blank line as:
SUGGESTED_FOLLOWUPS: ["Follow-up option 1", "Follow-up option 2", "Follow-up option 3"]`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    const fullText = response.text || "Here is your business intelligence overview for True Lengths.";
    let cleanText = fullText;
    let suggestions: string[] = [
      'Draft re-engagement outreach for inactive clients',
      'Which services drove the most completed revenue?',
      'Which inventory items need immediate reorder?',
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
