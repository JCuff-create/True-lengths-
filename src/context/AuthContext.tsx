import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { StaffInvite, UserProfile, UserRole, UserStatus } from '../types';
import { DEFAULT_SALON_ID, clearLegacyLocalDemoData } from '../lib/salonStore';

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
  createStaffInvite: (data: { name: string; email: string; phone?: string }) => Promise<StaffInvite>;
  revokeStaffInvite: (inviteId: string) => Promise<void>;
  updateOwnProfile: (incoming: Partial<UserProfile>) => Promise<UserProfile>;
  pendingStaffList: UserProfile[];
  allProfiles: UserProfile[];
  staffInvites: StaffInvite[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapUserDoc(uid: string, email: string, data: Record<string, unknown>): UserProfile {
  return {
    id: uid,
    uid,
    name: (data.name as string) || email.split('@')[0],
    email: (data.email as string) || email,
    role: (data.role as UserRole) || 'customer',
    status: (data.status as UserStatus) || 'active',
    salonId: (data.salonId as string) || DEFAULT_SALON_ID,
    avatar:
      (data.avatar as string) ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    phone: (data.phone as string) || '',
    hairType: (data.hairType as string) || '',
    loyaltyPoints: (data.loyaltyPoints as number) ?? (data.role === 'customer' ? 0 : undefined),
    loyaltyTier: (data.loyaltyTier as UserProfile['loyaltyTier']) || undefined,
    memberSince: (data.memberSince as string) || '',
    notes: (data.notes as string) || '',
    inviteCode: (data.inviteCode as string) || undefined,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingStaffList, setPendingStaffList] = useState<UserProfile[]>([]);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [staffInvites, setStaffInvites] = useState<StaffInvite[]>([]);
  const provisioningRef = useRef(false);

  const clearError = () => setAuthError(null);

  const fetchUserProfile = async (uid: string, email: string) => {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      setUserProfile(mapUserDoc(uid, email, docSnap.data() as Record<string, unknown>));
      return;
    }

    // Production owners are provisioned out-of-band (Console/Admin). The client
    // never creates or promotes owner profiles from an email allowlist.
    setAuthError(
      'No salon profile is linked to this account. Create a customer account or register as staff.'
    );
    await firebaseSignOut(auth);
    setFirebaseUser(null);
    setUserProfile(null);
  };

  useEffect(() => {
    clearLegacyLocalDemoData();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      try {
        if (user) {
          setFirebaseUser(user);
          if (!provisioningRef.current) {
            await fetchUserProfile(user.uid, user.email || '');
          }
        } else {
          setFirebaseUser(null);
          setUserProfile(null);
        }
      } catch (err: any) {
        console.error('Auth state error:', err);
        setAuthError(err.message || 'Unable to load profile.');
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (
      !userProfile ||
      userProfile.status !== 'active' ||
      (userProfile.role !== 'owner' && userProfile.role !== 'stylist')
    ) {
      setPendingStaffList([]);
      setAllProfiles([]);
      return;
    }

    // Owners: full directory. Active stylists: customers + stylists only (rules deny owner profiles).
    const usersQuery =
      userProfile.role === 'owner'
        ? collection(db, 'users')
        : query(collection(db, 'users'), where('role', 'in', ['customer', 'stylist']));

    const unsub = onSnapshot(
      usersQuery,
      (snapshot) => {
        const profiles: UserProfile[] = [];
        const pending: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          const prof = mapUserDoc(
            docSnap.id,
            (docSnap.data().email as string) || '',
            docSnap.data() as Record<string, unknown>
          );
          profiles.push(prof);
          if (prof.role === 'stylist' && prof.status === 'pending') pending.push(prof);
        });
        setAllProfiles(profiles);
        setPendingStaffList(pending);
      },
      (err) => {
        console.warn('Users directory listener:', err.message);
        setAllProfiles([]);
        setPendingStaffList([]);
      }
    );
    return () => unsub();
  }, [userProfile?.role, userProfile?.uid, userProfile?.status]);

  useEffect(() => {
    if (!userProfile || userProfile.role !== 'owner' || userProfile.status !== 'active') {
      setStaffInvites([]);
      return;
    }

    return onSnapshot(
      collection(db, 'staffInvites'),
      (snapshot) => {
        setStaffInvites(
          snapshot.docs.map((inviteDoc) => ({
            id: inviteDoc.id,
            ...(inviteDoc.data() as Omit<StaffInvite, 'id'>),
          }))
        );
      },
      (err) => {
        console.warn('Staff invitations listener:', err.message);
        setStaffInvites([]);
      }
    );
  }, [userProfile?.role, userProfile?.status]);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
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
    provisioningRef.current = true;
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
        loyaltyPoints: 0,
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
      provisioningRef.current = false;
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
    provisioningRef.current = true;
    let createdUser: User | null = null;
    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      const normalizedCode = data.inviteCode?.trim().toUpperCase();
      if (!normalizedCode) throw new Error('A valid owner invitation code is required.');
      if (!data.name.trim()) throw new Error('Enter your full name.');

      const userCred = await createUserWithEmailAndPassword(auth, normalizedEmail, data.pass);
      createdUser = userCred.user;
      const uid = userCred.user.uid;
      const inviteRef = doc(db, 'staffInvites', normalizedCode);
      const inviteSnap = await getDoc(inviteRef);
      if (!inviteSnap.exists()) throw new Error('This invitation code is invalid or unavailable.');
      const invite = inviteSnap.data() as Omit<StaffInvite, 'id'>;
      if (invite.status !== 'pending' || invite.role !== 'stylist') {
        throw new Error('This invitation has already been used or revoked.');
      }
      if (invite.email.trim().toLowerCase() !== normalizedEmail) {
        throw new Error('Use the same email address that received this invitation.');
      }

      const profileData: UserProfile = {
        id: uid,
        uid,
        name: invite.name || data.name.trim(),
        email: normalizedEmail,
        phone: invite.phone || data.phone || '',
        role: 'stylist',
        status: 'pending',
        salonId: DEFAULT_SALON_ID,
        avatar:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        inviteCode: normalizedCode,
      };

      const batch = writeBatch(db);
      batch.set(doc(db, 'users', uid), {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.update(inviteRef, {
        status: 'used',
        usedByUid: uid,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      setUserProfile(profileData);
      setFirebaseUser(userCred.user);
    } catch (err: any) {
      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch (cleanupError) {
          console.warn('Unable to remove incomplete staff account:', cleanupError);
        }
      }
      let cleanMsg = err.message;
      if (err.code === 'auth/email-already-in-use') cleanMsg = 'An account with this email already exists.';
      if (err.code === 'auth/operation-not-allowed') {
        cleanMsg = 'Email/password sign-up is not enabled for this Firebase project.';
      }
      setAuthError(cleanMsg);
      setLoading(false);
      throw new Error(cleanMsg);
    } finally {
      provisioningRef.current = false;
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } finally {
      clearLegacyLocalDemoData();
      setFirebaseUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  };

  const updateOwnProfile = async (incoming: Partial<UserProfile>): Promise<UserProfile> => {
    if (!userProfile || !firebaseUser) throw new Error('Not authenticated.');
    const next: UserProfile = {
      ...userProfile,
      name: incoming.name !== undefined ? String(incoming.name) : userProfile.name,
      phone: incoming.phone !== undefined ? String(incoming.phone) : userProfile.phone,
      avatar: incoming.avatar !== undefined ? String(incoming.avatar) : userProfile.avatar,
      hairType: incoming.hairType !== undefined ? String(incoming.hairType) : userProfile.hairType,
      notes: incoming.notes !== undefined ? String(incoming.notes) : userProfile.notes,
      email: incoming.email !== undefined ? String(incoming.email) : userProfile.email,
      loyaltyPoints:
        incoming.loyaltyPoints !== undefined ? incoming.loyaltyPoints : userProfile.loyaltyPoints,
      loyaltyTier: incoming.loyaltyTier !== undefined ? incoming.loyaltyTier : userProfile.loyaltyTier,
      // Locked admin fields
      role: userProfile.role,
      status: userProfile.status,
      salonId: userProfile.salonId,
      uid: userProfile.uid,
      id: userProfile.id,
    };
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      name: next.name,
      phone: next.phone || '',
      avatar: next.avatar || '',
      hairType: next.hairType || '',
      notes: next.notes || '',
      email: next.email,
      loyaltyPoints: next.loyaltyPoints ?? null,
      loyaltyTier: next.loyaltyTier ?? null,
      updatedAt: serverTimestamp(),
    });
    setUserProfile(next);
    return next;
  };

  const approveStaffAccount = async (staffUid: string) => {
    if (!userProfile || userProfile.role !== 'owner' || userProfile.status !== 'active') {
      throw new Error('Unauthorized: Only the salon owner can approve staff accounts.');
    }
    const staff = allProfiles.find((profile) => profile.uid === staffUid || profile.id === staffUid);
    if (!staff || staff.role !== 'stylist') throw new Error('Stylist profile not found.');

    const batch = writeBatch(db);
    batch.update(doc(db, 'users', staffUid), {
      status: 'active',
      role: 'stylist',
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'stylists', staffUid), {
      id: staffUid,
      name: staff.name,
      roleTitle: 'Stylist',
      bio: 'True Lengths salon stylist',
      avatar: staff.avatar || '',
      rating: 5,
      totalReviews: 0,
      specialties: [],
      commissionRate: 0.5,
      salonId: staff.salonId || DEFAULT_SALON_ID,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    await batch.commit();
  };

  const createStaffInvite = async (data: { name: string; email: string; phone?: string }) => {
    if (!userProfile || userProfile.role !== 'owner' || userProfile.status !== 'active') {
      throw new Error('Unauthorized: Only the salon owner can invite stylists.');
    }
    const normalizedEmail = data.email.trim().toLowerCase();
    const name = data.name.trim();
    if (!name || !normalizedEmail) throw new Error('Stylist name and email are required.');

    const inviteId = `TL-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const invite: StaffInvite = {
      id: inviteId,
      inviteId,
      name,
      email: normalizedEmail,
      phone: data.phone?.trim() || '',
      role: 'stylist',
      salonId: DEFAULT_SALON_ID,
      status: 'pending',
    };
    await setDoc(doc(db, 'staffInvites', inviteId), {
      ...invite,
      createdByUid: userProfile.uid || userProfile.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return invite;
  };

  const revokeStaffInvite = async (inviteId: string) => {
    if (!userProfile || userProfile.role !== 'owner' || userProfile.status !== 'active') {
      throw new Error('Unauthorized: Only the salon owner can revoke invitations.');
    }
    await updateDoc(doc(db, 'staffInvites', inviteId), {
      status: 'revoked',
      updatedAt: serverTimestamp(),
    });
  };

  const disableUserAccount = async (targetUid: string) => {
    if (!userProfile || userProfile.role !== 'owner' || userProfile.status !== 'active') {
      throw new Error('Unauthorized: Only the salon owner can modify user status.');
    }
    if (targetUid === userProfile.uid || targetUid === userProfile.id) {
      throw new Error('Owners cannot disable their own account.');
    }
    await updateDoc(doc(db, 'users', targetUid), {
      status: 'disabled',
      updatedAt: serverTimestamp(),
    });
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
        createStaffInvite,
        revokeStaffInvite,
        updateOwnProfile,
        pendingStaffList,
        allProfiles,
        staffInvites,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export { DEFAULT_SALON_ID };
