import express from 'express';
import path from 'path';
import { randomUUID } from 'crypto';
import { config as loadEnv } from 'dotenv';
import { assistantConfiguration, createAssistantHandler } from './src/server/assistant';
import { GoogleGenAI, type GenerateContentParameters } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { applicationDefault, getApps as getAdminApps, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import firebaseConfigJson from './firebase-applet-config.json';
import { canUploadAvatar } from './src/server/avatarAuthorization';
import { createMarketingHandler } from './src/server/marketing';

// Runtime-injected values take precedence; Cursor/local development can use either file.
loadEnv({ path: ['.env.local', '.env'], quiet: true });

const app = express();
// Cloud Run injects PORT (typically 8080). Local / AI Studio default to 3000.
const PORT = Number(process.env.PORT) || 3000;
const DEFAULT_SALON_ID = 'truelengths-main';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

app.use(express.json());

const adminApp = getAdminApps().length
  ? getAdminApps()[0]
  : initializeAdminApp({
      credential: applicationDefault(),
      projectId: firebaseConfigJson.projectId,
      storageBucket: firebaseConfigJson.storageBucket,
    });
const adminAuth = getAdminAuth(adminApp);
const adminDb = firebaseConfigJson.firestoreDatabaseId
  ? getAdminFirestore(adminApp, firebaseConfigJson.firestoreDatabaseId)
  : getAdminFirestore(adminApp);
const adminBucket = getAdminStorage(adminApp).bucket(firebaseConfigJson.storageBucket);

for (const action of ['preview', 'send'] as const) {
  app.post(`/api/marketing/${action}`, createMarketingHandler({
    db: adminDb, verifyToken: (token) => adminAuth.verifyIdToken(token, true), preview: action === 'preview',
  }));
}

function bearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith('Bearer ')) return null;
  return authorizationHeader.slice('Bearer '.length).trim();
}

// Storage Security Rules can consult only the default Firestore database. This
// app keeps account roles in a named database, so managed avatar uploads must
// be authorized here and written with the Admin SDK.
app.post(
  '/api/users/:targetUid/avatar',
  express.raw({ type: '*/*', limit: MAX_AVATAR_BYTES + 1 }),
  async (req, res) => {
    try {
      const token = bearerToken(req.header('authorization'));
      if (!token) return res.status(401).json({ error: 'Sign in again before uploading a profile picture.' });

      const contentType = String(req.header('content-type') || '').split(';')[0].trim().toLowerCase();
      if (!ALLOWED_AVATAR_TYPES.has(contentType)) {
        return res.status(415).json({ error: 'Choose a JPG, PNG, or WebP image.' });
      }

      const image = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      if (!image.length) return res.status(400).json({ error: 'The selected image is empty.' });
      if (image.length > MAX_AVATAR_BYTES) {
        return res.status(413).json({ error: 'Profile pictures must be 5 MB or smaller.' });
      }

      const decoded = await adminAuth.verifyIdToken(token);
      const targetUid = String(req.params.targetUid || '').trim();
      if (!targetUid) return res.status(400).json({ error: 'A valid profile is required.' });

      let actor;
      let target;
      if (decoded.uid !== targetUid) {
        const [actorSnapshot, targetSnapshot] = await Promise.all([
          adminDb.doc(`users/${decoded.uid}`).get(),
          adminDb.doc(`users/${targetUid}`).get(),
        ]);
        actor = actorSnapshot.data();
        target = targetSnapshot.data();
      }

      if (!canUploadAvatar(decoded.uid, targetUid, actor, target, DEFAULT_SALON_ID)) {
        return res.status(403).json({ error: 'You do not have permission to update this profile picture.' });
      }

      const objectPath = `users/${targetUid}/avatar`;
      const downloadToken = randomUUID();
      await adminBucket.file(objectPath).save(image, {
        resumable: false,
        metadata: {
          contentType,
          cacheControl: 'public,max-age=300',
          metadata: { firebaseStorageDownloadTokens: downloadToken },
        },
      });

      const encodedPath = encodeURIComponent(objectPath);
      const avatar = `https://firebasestorage.googleapis.com/v0/b/${adminBucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
      return res.json({ ok: true, avatar });
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      if (error?.code?.startsWith?.('auth/')) {
        return res.status(401).json({ error: 'Your session expired. Sign in again and retry.' });
      }
      return res.status(500).json({ error: 'Profile picture upload failed. Please retry.' });
    }
  }
);

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
    // Profiles created before salon IDs were required belong to the original
    // True Lengths tenant. Normalize only missing legacy values; an explicit
    // different salon ID must still be rejected.
    const ownerSalonId = String(owner.salonId || DEFAULT_SALON_ID).trim();
    const targetSalonId = String(target.salonId || DEFAULT_SALON_ID).trim();
    if (targetSalonId !== ownerSalonId) {
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

// Both assistants use the same configured provider and error contract.
const aiConfig = assistantConfiguration(process.env);
const aiClient = aiConfig.apiKey ? new GoogleGenAI({
  apiKey: aiConfig.apiKey,
  httpOptions: { timeout: 25000, retryOptions: { attempts: 1 } },
}) : null;
const assistantOptions = {
  model: aiConfig.model,
  generate: aiClient ? (request: GenerateContentParameters) => aiClient.models.generateContent(request) : null,
};
app.post('/api/ai/customer-assistant', createAssistantHandler('customer', assistantOptions));
app.post('/api/ai/owner-assistant', createAssistantHandler('owner', assistantOptions));

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
