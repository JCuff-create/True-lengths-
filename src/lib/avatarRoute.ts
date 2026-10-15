import express, { type RequestHandler } from 'express';
import {
  authorizeAvatarUpload,
  isSafeAvatarUid,
  MAX_AVATAR_BYTES,
  validateAvatarPayload,
  type UserRoleRecord,
} from './avatarPolicy';

export type AvatarUserSnapshot = {
  exists: boolean;
  data: UserRoleRecord;
};

export type AvatarUploadDeps = {
  verifyIdToken: (token: string) => Promise<{ uid: string }>;
  loadUser: (uid: string) => Promise<AvatarUserSnapshot>;
  upload: (input: { targetUid: string; body: Buffer; contentType: string }) => Promise<string>;
};

function bearerToken(authorizationHeader?: string): string | null {
  if (!authorizationHeader?.startsWith('Bearer ')) return null;
  const token = authorizationHeader.slice('Bearer '.length).trim();
  return token || null;
}

function isPayloadTooLarge(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { status?: unknown; statusCode?: unknown; type?: unknown };
  return candidate.status === 413 || candidate.statusCode === 413 || candidate.type === 'entity.too.large';
}

const parseAvatarBody: RequestHandler = (req, res, next) => {
  express.raw({ type: () => true, limit: MAX_AVATAR_BYTES })(req, res, (error?: unknown) => {
    if (!error) {
      next();
      return;
    }
    if (isPayloadTooLarge(error)) {
      res.status(413).json({ error: 'Profile pictures must be 5 MB or smaller.' });
      return;
    }
    next(error);
  });
};

export function avatarUploadHandlers(deps: AvatarUploadDeps): RequestHandler[] {
  const handleAvatarUpload: RequestHandler = async (req, res) => {
    try {
      const token = bearerToken(req.header('authorization'));
      if (!token) {
        res.status(401).json({ error: 'Authentication is required.' });
        return;
      }

      let actorUid = '';
      try {
        const decoded = await deps.verifyIdToken(token);
        actorUid = decoded.uid;
      } catch (error) {
        console.error('Avatar upload rejected an invalid ID token:', error);
        res.status(401).json({ error: 'Authentication is required.' });
        return;
      }
      if (!actorUid) {
        res.status(401).json({ error: 'Authentication is required.' });
        return;
      }

      const targetUid = String(req.params.targetUid || '').trim();
      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      if (!isSafeAvatarUid(targetUid)) {
        res.status(400).json({ error: 'A valid user is required.' });
        return;
      }

      const payload = validateAvatarPayload({
        contentType: req.header('content-type'),
        byteLength: body.length,
      });
      if ('error' in payload) {
        res.status(payload.status).json({ error: payload.error });
        return;
      }

      if (actorUid !== targetUid) {
        const actorSnapshot = await deps.loadUser(actorUid);
        const targetSnapshot = await deps.loadUser(targetUid);
        const decision = authorizeAvatarUpload({
          actorUid,
          targetUid,
          actor: actorSnapshot.exists ? actorSnapshot.data : null,
          target: targetSnapshot.exists ? targetSnapshot.data : null,
          targetExists: targetSnapshot.exists,
        });
        if ('error' in decision) {
          res.status(decision.status).json({ error: decision.error });
          return;
        }
      }

      const avatar = await deps.upload({
        targetUid,
        body,
        contentType: payload.contentType,
      });
      res.json({ ok: true, avatar });
    } catch (error) {
      console.error('Avatar upload failed:', error);
      res.status(500).json({ error: 'Profile picture upload failed.' });
    }
  };

  return [parseAvatarBody, handleAvatarUpload];
}
