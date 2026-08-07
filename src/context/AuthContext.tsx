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
  isValidRole,
  OWNER_BOOTSTRAP_EMAIL,
  STYLIST_INVITE_CODE,
} from '../lib/roles';

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
  /** Stylist self-registration via owner invite — always pending until owner approves */
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
  pendingStaffList: UserProfile[];
  allProfiles: UserProfile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEFAULT_SALON_ID = 'truelengths-main';

function mapFirestoreProfile(uid: string, email: string, data: Record<string, unknown>): UserProfile {
  const roleRaw = data.role;
  const role: UserRole = isValidRole(roleRaw) ? roleRaw : 'customer';
  return {
    id: uid,
    uid,
    name: (data.name as string) || email.split('@')[0],
    email: (data.email as string) || email,
    role,
    status: (data.status as UserStatus) || 'active',
    salonId: (data.salonId as string) || DEFAULT_SALON_ID,
    avatar:
      (data.avatar as string) ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    phone: (data.phone as string) || '',
    hairType: (data.hairType as string) || '',
    loyaltyPoints: (data.loyaltyPoints as number) ?? 100,
    loyaltyTier: (data.loyaltyTier as UserProfile['loyaltyTier']) || 'Gold',
    memberSince: (data.memberSince as string) || '2024',
    notes: (data.notes as string) || '',
  };
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
      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const profile = mapFirestoreProfile(uid, email, docSnap.data() as Record<string, unknown>);
        setUserProfile(profile);
        return;
      }

      // Only the designated owner email may bootstrap an owner profile on first login.
      const isOwnerEmail = email.toLowerCase() === OWNER_BOOTSTRAP_EMAIL;
      if (!isOwnerEmail) {
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

      await setDoc(userRef, {
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
    // Clear legacy demo sessions — roles must come from Firebase Auth + Firestore only
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

  // Owner/stylist management listeners (staff directory)
  useEffect(() => {
    if (!userProfile || (userProfile.role !== 'owner' && userProfile.role !== 'stylist')) {
      setPendingStaffList([]);
      setAllProfiles([]);
      return;
    }

    const usersRef = collection(db, 'users');
    const unsub = onSnapshot(
      usersRef,
      (snapshot) => {
        const profiles: UserProfile[] = [];
        const pending: UserProfile[] = [];

        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as Record<string, unknown>;
          const prof = mapFirestoreProfile(docSnap.id, (d.email as string) || '', d);
          profiles.push(prof);
          if (prof.role === 'stylist' && prof.status === 'pending') {
            pending.push(prof);
          }
        });

        setAllProfiles(profiles);
        setPendingStaffList(pending);
      },
      (err) => {
        console.warn('Firestore snapshot notice:', err.message);
      }
    );

    return () => unsub();
  }, [userProfile]);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // Profile + role loaded by onAuthStateChanged -> fetchUserProfile
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

  /** Public signup — role is ALWAYS customer; never stylist/owner */
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

      await setDoc(doc(db, 'users', uid), {
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

  /**
   * Stylist registration via owner invite code.
   * Always creates role=stylist, status=pending (owner must approve).
   * Owner accounts cannot be created here.
   */
  const signUpStaff = async (data: {
    email: string;
    pass: string;
    name: string;
    phone?: string;
    inviteCode?: string;
  }) => {
    setLoading(true);
    setAuthError(null);

    const code = (data.inviteCode || '').trim().toUpperCase();
    if (code !== STYLIST_INVITE_CODE) {
      const msg =
        'A valid owner stylist invite code is required to register as staff. Contact the salon owner.';
      setAuthError(msg);
      setLoading(false);
      throw new Error(msg);
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, data.email, data.pass);
      const uid = userCred.user.uid;

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

      await setDoc(doc(db, 'users', uid), {
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

  const approveStaffAccount = async (staffUid: string) => {
    if (!userProfile || userProfile.role !== 'owner') {
      throw new Error('Unauthorized: Only the salon owner can approve staff accounts.');
    }
    try {
      const staffRef = doc(db, 'users', staffUid);
      const snap = await getDoc(staffRef);
      if (!snap.exists()) throw new Error('Staff account not found.');
      const data = snap.data();
      if (data.role !== 'stylist') {
        throw new Error('Only stylist accounts can be approved through staff management.');
      }
      await updateDoc(staffRef, {
        status: 'active',
        // role stays stylist — owners must not escalate via this path
        role: 'stylist',
        updatedAt: serverTimestamp(),
      });
    } catch (e: any) {
      console.error('Approve staff error:', e);
      throw e;
    }

    setPendingStaffList((prev) => prev.filter((p) => p.id !== staffUid && p.uid !== staffUid));
    setAllProfiles((prev) =>
      prev.map((p) =>
        p.id === staffUid || p.uid === staffUid ? { ...p, status: 'active', role: 'stylist' } : p
      )
    );
  };

  const disableUserAccount = async (targetUid: string) => {
    if (!userProfile || userProfile.role !== 'owner') {
      throw new Error('Unauthorized: Only the salon owner can modify user status.');
    }
    if (targetUid === userProfile.uid || targetUid === userProfile.id) {
      throw new Error('Owners cannot disable their own account.');
    }
    try {
      const targetRef = doc(db, 'users', targetUid);
      await updateDoc(targetRef, {
        status: 'disabled',
        updatedAt: serverTimestamp(),
      });
    } catch (e: any) {
      console.error('Disable account error:', e);
      throw e;
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
