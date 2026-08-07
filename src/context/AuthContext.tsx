import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole, UserStatus } from '../types';
import {
  DEFAULT_SALON_ID,
  PROFILE_COLLECTIONS,
  collectionForRole,
  isBootstrapOwnerEmail,
  mapProfileDoc,
  sanitizePersonalProfileUpdate,
} from '../lib/profiles';

interface AuthContextType {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  clearError: () => void;
  signIn: (email: string, pass: string) => Promise<void>;
  signUpCustomer: (data: {
    email: string;
    pass: string;
    name: string;
    phone?: string;
    hairType?: string;
  }) => Promise<void>;
  signUpStaff: (data: {
    email: string;
    pass: string;
    name: string;
    phone?: string;
    inviteCode?: string;
  }) => Promise<void>;
  signOutUser: () => Promise<void>;
  approveStaffAccount: (staffUid: string) => Promise<void>;
  disableUserAccount: (targetUid: string) => Promise<void>;
  updateOwnProfile: (incoming: Partial<UserProfile>) => Promise<void>;
  pendingStaffList: UserProfile[];
  allProfiles: UserProfile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { DEFAULT_SALON_ID };

async function resolveProfileFromRoleCollections(
  uid: string,
  email: string
): Promise<UserProfile | null> {
  // Check owners first so stylists/customers never receive owner docs via ambiguity
  const ownerSnap = await getDoc(doc(db, PROFILE_COLLECTIONS.owner, uid));
  if (ownerSnap.exists()) {
    return mapProfileDoc(uid, email, 'owner', ownerSnap.data() as Record<string, unknown>);
  }

  const stylistSnap = await getDoc(doc(db, PROFILE_COLLECTIONS.stylist, uid));
  if (stylistSnap.exists()) {
    return mapProfileDoc(uid, email, 'stylist', stylistSnap.data() as Record<string, unknown>);
  }

  const customerSnap = await getDoc(doc(db, PROFILE_COLLECTIONS.customer, uid));
  if (customerSnap.exists()) {
    return mapProfileDoc(uid, email, 'customer', customerSnap.data() as Record<string, unknown>);
  }

  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [pendingStaffList, setPendingStaffList] = useState<UserProfile[]>([]);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);

  const clearError = () => setAuthError(null);

  const fetchUserProfile = async (uid: string, email: string) => {
    try {
      const existing = await resolveProfileFromRoleCollections(uid, email);
      if (existing) {
        setUserProfile(existing);
        return;
      }

      if (!isBootstrapOwnerEmail(email)) {
        setAuthError(
          'No salon profile is linked to this account. Create a customer account, or ask the salon owner for a stylist invite.'
        );
        await firebaseSignOut(auth);
        setFirebaseUser(null);
        setUserProfile(null);
        return;
      }

      const newProfile: UserProfile = {
        id: uid,
        uid,
        name: 'Carolyn R. (Owner)',
        email,
        role: 'owner',
        status: 'active',
        salonId: DEFAULT_SALON_ID,
        avatar:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        loyaltyPoints: 100,
        loyaltyTier: 'Gold',
        memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      };

      await setDoc(doc(db, PROFILE_COLLECTIONS.owner, uid), {
        ...newProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setUserProfile(newProfile);
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setAuthError(`Unable to fetch user role: ${err.message}`);
    }
  };

  useEffect(() => {
    localStorage.removeItem('tl_demo_user');

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setFirebaseUser(user);
        await fetchUserProfile(user.uid, user.email || '');
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Directory listeners — never attach owners collection for stylists/customers
  useEffect(() => {
    if (!userProfile) {
      setPendingStaffList([]);
      setAllProfiles([]);
      return;
    }

    if (userProfile.role === 'customer') {
      setPendingStaffList([]);
      setAllProfiles([]);
      return;
    }

    const unsubs: Array<() => void> = [];
    const profilesById = new Map<string, UserProfile>();

    const publish = () => {
      const list = Array.from(profilesById.values());
      setAllProfiles(list);
      setPendingStaffList(
        list.filter((p) => p.role === 'stylist' && p.status === 'pending')
      );
    };

    const watchCollection = (role: UserRole) => {
      const col = collection(db, collectionForRole(role));
      const unsub = onSnapshot(
        col,
        (snapshot) => {
          // Clear previous entries for this role before re-adding
          for (const [id, prof] of profilesById) {
            if (prof.role === role) profilesById.delete(id);
          }
          snapshot.forEach((docSnap) => {
            const d = docSnap.data() as Record<string, unknown>;
            profilesById.set(docSnap.id, mapProfileDoc(docSnap.id, (d.email as string) || '', role, d));
          });
          publish();
        },
        (err) => {
          console.warn(`Firestore ${role} directory notice:`, err.message);
        }
      );
      unsubs.push(unsub);
    };

    // Stylists: customers + stylists only (owners denied by rules)
    watchCollection('customer');
    watchCollection('stylist');

    // Owners also see owner profiles for admin directory
    if (userProfile.role === 'owner') {
      watchCollection('owner');
    }

    return () => unsubs.forEach((u) => u());
  }, [userProfile?.role, userProfile?.uid]);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error('Sign in error:', err);
      let cleanMsg = 'Invalid email or password. Please verify your credentials.';
      if (err.code === 'auth/user-not-found') cleanMsg = 'No account found with this email.';
      if (err.code === 'auth/wrong-password') cleanMsg = 'Incorrect password.';
      if (err.code === 'auth/invalid-credential') cleanMsg = 'Invalid login credentials.';
      if (err.code === 'auth/operation-not-allowed') {
        cleanMsg = 'Email/password sign-in is not enabled for this Firebase project.';
      }
      setAuthError(cleanMsg);
      setLoading(false);
      throw new Error(cleanMsg);
    }
  };

  const signUpCustomer = async (data: {
    email: string;
    pass: string;
    name: string;
    phone?: string;
    hairType?: string;
  }) => {
    setLoading(true);
    setAuthError(null);

    try {
      const userCred = await createUserWithEmailAndPassword(auth, data.email, data.pass);
      const uid = userCred.user.uid;

      const profileData: UserProfile = {
        id: uid,
        uid,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        role: 'customer',
        status: 'active',
        salonId: DEFAULT_SALON_ID,
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        hairType: data.hairType || '4C - High Density Coily',
        loyaltyPoints: 100,
        loyaltyTier: 'Gold',
        memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      };

      // Public signup writes ONLY to /customers/{uid}
      await setDoc(doc(db, PROFILE_COLLECTIONS.customer, uid), {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setUserProfile(profileData);
      setFirebaseUser(userCred.user);
    } catch (err: any) {
      console.error('Customer sign up error:', err);
      let cleanMsg = err.message;
      if (err.code === 'auth/email-already-in-use') cleanMsg = 'An account with this email already exists.';
      if (err.code === 'auth/weak-password') cleanMsg = 'Password should be at least 6 characters.';
      if (err.code === 'auth/operation-not-allowed') {
        cleanMsg = 'Email/password sign-up is not enabled for this Firebase project.';
      }
      setAuthError(cleanMsg);
      setLoading(false);
      throw new Error(cleanMsg);
    } finally {
      setLoading(false);
    }
  };

  const signUpStaff = async (data: {
    email: string;
    pass: string;
    name: string;
    phone?: string;
    inviteCode?: string;
  }) => {
    setLoading(true);
    setAuthError(null);

    const code = (data.inviteCode || '').trim();
    if (!code) {
      const msg = 'A valid owner stylist invite code is required to register as staff.';
      setAuthError(msg);
      setLoading(false);
      throw new Error(msg);
    }

    try {
      const validateRes = await fetch('/api/invites/stylist/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const validateJson = await validateRes.json();
      if (!validateRes.ok || !validateJson.valid) {
        const msg = validateJson.error || 'Invalid or expired stylist invite code.';
        setAuthError(msg);
        setLoading(false);
        throw new Error(msg);
      }

      const userCred = await createUserWithEmailAndPassword(auth, data.email, data.pass);
      const uid = userCred.user.uid;
      const idToken = await userCred.user.getIdToken();

      const consumeRes = await fetch('/api/invites/stylist/consume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ code, uid, idToken }),
      });
      const consumeJson = await consumeRes.json();
      if (!consumeRes.ok || !consumeJson.ok) {
        try {
          await userCred.user.delete();
        } catch (delErr) {
          console.warn('Failed to roll back Auth user after invite consume failure:', delErr);
        }
        const msg = consumeJson.error || 'Invite could not be redeemed. Request a new invite from the owner.';
        setAuthError(msg);
        setLoading(false);
        throw new Error(msg);
      }

      const profileData: UserProfile = {
        id: uid,
        uid,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        role: 'stylist',
        status: 'pending',
        salonId: DEFAULT_SALON_ID,
        avatar:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      };

      // Staff signup writes ONLY to /stylists/{uid} — never owners/
      await setDoc(doc(db, PROFILE_COLLECTIONS.stylist, uid), {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setUserProfile(profileData);
      setFirebaseUser(userCred.user);
    } catch (err: any) {
      console.error('Staff sign up error:', err);
      let cleanMsg = err.message;
      if (err.code === 'auth/email-already-in-use') cleanMsg = 'An account with this email already exists.';
      if (err.code === 'auth/operation-not-allowed') {
        cleanMsg = 'Email/password sign-up is not enabled for this Firebase project.';
      }
      setAuthError(cleanMsg);
      setLoading(false);
      throw new Error(cleanMsg);
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      console.error('Sign out error:', err);
    } finally {
      localStorage.removeItem('tl_demo_user');
      setFirebaseUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  };

  const updateOwnProfile = async (incoming: Partial<UserProfile>) => {
    if (!userProfile || !firebaseUser) {
      throw new Error('Not authenticated.');
    }
    const sanitized = sanitizePersonalProfileUpdate(userProfile, incoming);
    const col = collectionForRole(userProfile.role);
    await updateDoc(doc(db, col, firebaseUser.uid), {
      name: sanitized.name,
      phone: sanitized.phone || '',
      avatar: sanitized.avatar || '',
      hairType: sanitized.hairType || '',
      notes: sanitized.notes || '',
      email: sanitized.email,
      loyaltyPoints: sanitized.loyaltyPoints ?? null,
      loyaltyTier: sanitized.loyaltyTier ?? null,
      memberSince: sanitized.memberSince || '',
      updatedAt: serverTimestamp(),
    });
    setUserProfile(sanitized);
  };

  const approveStaffAccount = async (staffUid: string) => {
    if (!userProfile || userProfile.role !== 'owner' || userProfile.status !== 'active') {
      throw new Error('Unauthorized: Only the salon owner can approve staff accounts.');
    }
    const staffRef = doc(db, PROFILE_COLLECTIONS.stylist, staffUid);
    const snap = await getDoc(staffRef);
    if (!snap.exists()) throw new Error('Staff account not found in stylists collection.');
    const data = snap.data();
    if (data.role !== 'stylist') {
      throw new Error('Only stylist accounts can be approved through staff management.');
    }
    await updateDoc(staffRef, {
      status: 'active',
      role: 'stylist',
      updatedAt: serverTimestamp(),
    });

    setPendingStaffList((prev) => prev.filter((p) => p.id !== staffUid && p.uid !== staffUid));
    setAllProfiles((prev) =>
      prev.map((p) =>
        p.id === staffUid || p.uid === staffUid ? { ...p, status: 'active', role: 'stylist' } : p
      )
    );
  };

  const disableUserAccount = async (targetUid: string) => {
    if (!userProfile || userProfile.role !== 'owner' || userProfile.status !== 'active') {
      throw new Error('Unauthorized: Only the salon owner can modify user status.');
    }
    if (targetUid === userProfile.uid || targetUid === userProfile.id) {
      throw new Error('Owners cannot disable their own account.');
    }

    // Never touch owners collection for disable-via-staff tools — stylists/customers only
    const stylistRef = doc(db, PROFILE_COLLECTIONS.stylist, targetUid);
    const stylistSnap = await getDoc(stylistRef);
    if (stylistSnap.exists()) {
      await updateDoc(stylistRef, { status: 'disabled', updatedAt: serverTimestamp() });
    } else {
      const customerRef = doc(db, PROFILE_COLLECTIONS.customer, targetUid);
      const customerSnap = await getDoc(customerRef);
      if (!customerSnap.exists()) throw new Error('Account not found.');
      await updateDoc(customerRef, { status: 'disabled', updatedAt: serverTimestamp() });
    }

    setAllProfiles((prev) =>
      prev.map((p) => (p.id === targetUid || p.uid === targetUid ? { ...p, status: 'disabled' } : p))
    );
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        loading,
        authError,
        clearError,
        signIn,
        signUpCustomer,
        signUpStaff,
        signOutUser,
        approveStaffAccount,
        disableUserAccount,
        updateOwnProfile,
        pendingStaffList,
        allProfiles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
