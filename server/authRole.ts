import fs from 'fs';
import path from 'path';

export type AuthRole = 'customer' | 'stylist' | 'owner';

export type VerifiedIdentity = {
  uid: string;
  email: string;
  role: AuthRole;
  status: 'active' | 'pending' | 'disabled';
  profile: Record<string, unknown>;
  collection: 'customers' | 'stylists' | 'owners';
};

type FirebaseAppletConfig = {
  projectId: string;
  appId: string;
  apiKey: string;
  firestoreDatabaseId?: string;
};

const OWNER_BOOTSTRAP_EMAIL = 'carolyn.owner@truelengths.com';

export function loadFirebaseConfig(): FirebaseAppletConfig {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw) as FirebaseAppletConfig;
}

function firestoreDocUrl(config: FirebaseAppletConfig, collection: string, uid: string): string {
  const databaseId = config.firestoreDatabaseId || '(default)';
  return `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${encodeURIComponent(
    databaseId
  )}/documents/${collection}/${uid}`;
}

function decodeFirestoreFields(fields: Record<string, any> | undefined): Record<string, unknown> {
  if (!fields) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value.stringValue !== undefined) out[key] = value.stringValue;
    else if (value.integerValue !== undefined) out[key] = Number(value.integerValue);
    else if (value.doubleValue !== undefined) out[key] = Number(value.doubleValue);
    else if (value.booleanValue !== undefined) out[key] = value.booleanValue;
    else if (value.nullValue !== undefined) out[key] = null;
  }
  return out;
}

async function fetchRoleDoc(
  idToken: string,
  config: FirebaseAppletConfig,
  collection: 'customers' | 'stylists' | 'owners',
  uid: string
): Promise<Record<string, unknown> | null> {
  const res = await fetch(firestoreDocUrl(config, collection, uid), {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { fields?: Record<string, any> };
  return decodeFirestoreFields(json.fields);
}

/** Verify Firebase ID token only (no profile/role lookup). Used for brand-new accounts. */
export async function verifyIdToken(idToken: string): Promise<{ uid: string; email: string }> {
  if (!idToken || typeof idToken !== 'string') {
    throw Object.assign(new Error('Missing authentication token.'), { status: 401 });
  }

  const config = loadFirebaseConfig();
  const apiKey = process.env.VITE_FIREBASE_API_KEY || config.apiKey;

  const lookupRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!lookupRes.ok) {
    throw Object.assign(new Error('Invalid or expired authentication token.'), { status: 401 });
  }

  const lookupData = (await lookupRes.json()) as {
    users?: Array<{ localId?: string; email?: string }>;
  };
  const user = lookupData.users?.[0];
  if (!user?.localId || !user.email) {
    throw Object.assign(new Error('Unable to verify authenticated user.'), { status: 401 });
  }

  return { uid: user.localId, email: user.email.toLowerCase() };
}

/** Verify Firebase ID token and resolve role from owners/stylists/customers (never trust client role). */
export async function verifyIdTokenAndRole(idToken: string): Promise<VerifiedIdentity> {
  const { uid, email } = await verifyIdToken(idToken);
  const config = loadFirebaseConfig();

  const ownerDoc = await fetchRoleDoc(idToken, config, 'owners', uid);
  if (ownerDoc) {
    const status = (ownerDoc.status as VerifiedIdentity['status']) || 'active';
    return {
      uid,
      email,
      role: 'owner',
      status,
      profile: ownerDoc,
      collection: 'owners',
    };
  }

  const stylistDoc = await fetchRoleDoc(idToken, config, 'stylists', uid);
  if (stylistDoc) {
    const status = (stylistDoc.status as VerifiedIdentity['status']) || 'pending';
    return {
      uid,
      email,
      role: 'stylist',
      status,
      profile: stylistDoc,
      collection: 'stylists',
    };
  }

  const customerDoc = await fetchRoleDoc(idToken, config, 'customers', uid);
  if (customerDoc) {
    const status = (customerDoc.status as VerifiedIdentity['status']) || 'active';
    return {
      uid,
      email,
      role: 'customer',
      status,
      profile: customerDoc,
      collection: 'customers',
    };
  }

  // Bootstrap owner may not have a doc yet
  if (email === OWNER_BOOTSTRAP_EMAIL) {
    return {
      uid,
      email,
      role: 'owner',
      status: 'active',
      profile: { email, role: 'owner', status: 'active' },
      collection: 'owners',
    };
  }

  throw Object.assign(new Error('No salon profile is linked to this account.'), { status: 403 });
}

export async function verifyActiveOwner(idToken: string): Promise<VerifiedIdentity> {
  const identity = await verifyIdTokenAndRole(idToken);
  if (identity.role !== 'owner' || identity.status !== 'active') {
    throw Object.assign(new Error('Only active salon owners can perform this action.'), {
      status: 403,
    });
  }
  return identity;
}

/** Server-side authorization matrix for reading a target profile by role collection */
export function canReadProfile(
  actor: VerifiedIdentity,
  targetRole: AuthRole,
  targetUid: string
): boolean {
  if (actor.status === 'disabled') return false;

  if (actor.role === 'owner' && actor.status === 'active') {
    return true;
  }

  if (actor.role === 'stylist') {
    if (actor.status !== 'active' && actor.status !== 'pending') return false;
    // Pending stylists may only read their own stylist profile
    if (actor.status === 'pending') {
      return targetRole === 'stylist' && targetUid === actor.uid;
    }
    // Active stylists: own stylist, other stylists, customers — never owners
    if (targetRole === 'owner') return false;
    if (targetRole === 'stylist') return true;
    if (targetRole === 'customer') return true;
    return false;
  }

  if (actor.role === 'customer') {
    return targetRole === 'customer' && targetUid === actor.uid;
  }

  return false;
}

export function collectionForRole(role: AuthRole): 'customers' | 'stylists' | 'owners' {
  if (role === 'customer') return 'customers';
  if (role === 'stylist') return 'stylists';
  return 'owners';
}

export async function fetchProfileByRole(
  idToken: string,
  role: AuthRole,
  uid: string
): Promise<Record<string, unknown> | null> {
  const config = loadFirebaseConfig();
  return fetchRoleDoc(idToken, config, collectionForRole(role), uid);
}
