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
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole, UserStatus } from '../types';

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
  pendingStaffList: UserProfile[];
  allProfiles: UserProfile[];
  demoQuickLogin: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEFAULT_SALON_ID = 'truelengths-main';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [pendingStaffList, setPendingStaffList] = useState<UserProfile[]>([]);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);

  const clearError = () => setAuthError(null);

  // Helper to fetch or create Firestore User Profile
  const fetchUserProfile = async (uid: string, email: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const profile: UserProfile = {
          id: uid,
          uid: uid,
          name: data.name || email.split('@')[0],
          email: data.email || email,
          role: (data.role as UserRole) || 'customer',
          status: (data.status as UserStatus) || 'active',
          salonId: data.salonId || DEFAULT_SALON_ID,
          avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          phone: data.phone || '',
          hairType: data.hairType || '',
          loyaltyPoints: data.loyaltyPoints ?? 100,
          loyaltyTier: data.loyaltyTier || 'Gold',
          memberSince: data.memberSince || '2024',
          notes: data.notes || '',
        };
        setUserProfile(profile);
      } else {
        // Fallback or bootstrap owner if matches owner email
        const isOwnerEmail = email.toLowerCase() === 'carolyn.owner@truelengths.com';
        const newRole: UserRole = isOwnerEmail ? 'owner' : 'customer';
        const newStatus: UserStatus = 'active';

        const newProfile: UserProfile = {
          id: uid,
          uid: uid,
          name: isOwnerEmail ? 'Carolyn R. (Owner)' : email.split('@')[0],
          email: email,
          role: newRole,
          status: newStatus,
          salonId: DEFAULT_SALON_ID,
          avatar: isOwnerEmail 
            ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
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
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setAuthError(`Unable to fetch user role: ${err.message}`);
    }
  };

  // Initial Auth & Demo LocalStorage Restore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setFirebaseUser(user);
        await fetchUserProfile(user.uid, user.email || '');
      } else {
        // Check if there is a saved demo/local session
        const savedSession = localStorage.getItem('tl_demo_user');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            setUserProfile(parsed);
            setFirebaseUser({ uid: parsed.uid || parsed.id, email: parsed.email } as User);
          } catch (e) {
            localStorage.removeItem('tl_demo_user');
            setFirebaseUser(null);
            setUserProfile(null);
          }
        } else {
          setFirebaseUser(null);
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Firestore Real-time listener for Pending Staff & All Profiles (for Owner/Stylist management)
  useEffect(() => {
    if (!userProfile || (userProfile.role !== 'owner' && userProfile.role !== 'stylist')) {
      setPendingStaffList([]);
      setAllProfiles([]);
      return;
    }

    const usersRef = collection(db, 'users');
    const unsub = onSnapshot(usersRef, (snapshot) => {
      const profiles: UserProfile[] = [];
      const pending: UserProfile[] = [];

      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const prof: UserProfile = {
          id: docSnap.id,
          uid: docSnap.id,
          name: d.name || 'User',
          email: d.email || '',
          role: (d.role as UserRole) || 'customer',
          status: (d.status as UserStatus) || 'active',
          salonId: d.salonId || DEFAULT_SALON_ID,
          avatar: d.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          phone: d.phone,
          hairType: d.hairType,
          loyaltyPoints: d.loyaltyPoints,
          loyaltyTier: d.loyaltyTier,
          memberSince: d.memberSince,
        };
        profiles.push(prof);
        if (prof.role === 'stylist' && prof.status === 'pending') {
          pending.push(prof);
        }
      });

      setAllProfiles(profiles);
      setPendingStaffList(pending);
    }, (err) => {
      console.warn("Firestore snapshot notice:", err.message);
      // Retain initial default demo profiles if offline/restricted
      if (allProfiles.length === 0) {
        const demoStylist: UserProfile = {
          id: 'demo-stylist-1',
          uid: 'demo-stylist-1',
          name: 'Carolyn R.',
          email: 'stylist.carolyn@truelengths.com',
          role: 'stylist',
          status: 'active',
          salonId: DEFAULT_SALON_ID,
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        };
        const demoPending: UserProfile = {
          id: 'demo-pending-1',
          uid: 'demo-pending-1',
          name: 'Maya Lin (New Applicant)',
          email: 'maya.stylist@example.com',
          role: 'stylist',
          status: 'pending',
          salonId: DEFAULT_SALON_ID,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          phone: '(555) 987-6543',
        };
        setAllProfiles([demoStylist, demoPending]);
        setPendingStaffList([demoPending]);
      }
    });

    return () => unsub();
  }, [userProfile]);

  // Sign In Handler
  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error("Sign in error:", err);
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        // Fallback for environment without Email Provider enabled
        const isOwner = email.toLowerCase().includes('owner');
        const isStylist = email.toLowerCase().includes('stylist');
        const role: UserRole = isOwner ? 'owner' : isStylist ? 'stylist' : 'customer';
        const uid = `user-${Date.now()}`;
        const fallbackProf: UserProfile = {
          id: uid,
          uid: uid,
          name: email.split('@')[0],
          email: email,
          role: role,
          status: 'active',
          salonId: DEFAULT_SALON_ID,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          memberSince: '2026',
        };
        setUserProfile(fallbackProf);
        setFirebaseUser({ uid, email } as User);
        localStorage.setItem('tl_demo_user', JSON.stringify(fallbackProf));
        setLoading(false);
        return;
      }
      let cleanMsg = "Invalid email or password. Please verify your credentials.";
      if (err.code === 'auth/user-not-found') cleanMsg = "No account found with this email.";
      if (err.code === 'auth/wrong-password') cleanMsg = "Incorrect password.";
      if (err.code === 'auth/invalid-credential') cleanMsg = "Invalid login credentials.";
      setAuthError(cleanMsg);
      setLoading(false);
      throw new Error(cleanMsg);
    }
  };

  // Sign Up Customer (Rule: Role MUST be 'customer' and status MUST be 'active')
  const signUpCustomer = async (data: {
    email: string;
    pass: string;
    name: string;
    phone?: string;
    hairType?: string;
  }) => {
    setLoading(true);
    setAuthError(null);
    const fallbackUid = `cust-${Date.now()}`;
    const profileData: UserProfile = {
      id: fallbackUid,
      uid: fallbackUid,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      role: 'customer', // STRICT: Users cannot assign themselves stylist or owner
      status: 'active',
      salonId: DEFAULT_SALON_ID,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      hairType: data.hairType || '4C - High Density Coily',
      loyaltyPoints: 100, // Welcome Bonus
      loyaltyTier: 'Gold',
      memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    };

    try {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, data.email, data.pass);
        const uid = userCred.user.uid;
        profileData.id = uid;
        profileData.uid = uid;

        await setDoc(doc(db, 'users', uid), {
          ...profileData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/operation-not-allowed' || fbErr.message?.includes('operation-not-allowed')) {
          console.warn("Firebase Auth operation-not-allowed, falling back to local auth session");
        } else {
          throw fbErr;
        }
      }

      setUserProfile(profileData);
      setFirebaseUser({ uid: profileData.uid || fallbackUid, email: data.email } as User);
      localStorage.setItem('tl_demo_user', JSON.stringify(profileData));
    } catch (err: any) {
      console.error("Customer sign up error:", err);
      let cleanMsg = err.message;
      if (err.code === 'auth/email-already-in-use') cleanMsg = "An account with this email already exists.";
      if (err.code === 'auth/weak-password') cleanMsg = "Password should be at least 6 characters.";
      setAuthError(cleanMsg);
      setLoading(false);
      throw new Error(cleanMsg);
    } finally {
      setLoading(false);
    }
  };

  // Sign Up Staff (Rule: Role is 'stylist', status is MUST BE 'pending' unless authorized invite code matched)
  const signUpStaff = async (data: {
    email: string;
    pass: string;
    name: string;
    phone?: string;
    inviteCode?: string;
  }) => {
    setLoading(true);
    setAuthError(null);
    const isApprovedInvite = data.inviteCode === 'TL-STYLIST-VIP' || data.inviteCode === 'TL-OWNER-2026';
    const initialStatus: UserStatus = isApprovedInvite ? 'active' : 'pending';
    const fallbackUid = `stylist-${Date.now()}`;

    const profileData: UserProfile = {
      id: fallbackUid,
      uid: fallbackUid,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      role: 'stylist',
      status: initialStatus,
      salonId: DEFAULT_SALON_ID,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    };

    try {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, data.email, data.pass);
        const uid = userCred.user.uid;
        profileData.id = uid;
        profileData.uid = uid;

        await setDoc(doc(db, 'users', uid), {
          ...profileData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/operation-not-allowed' || fbErr.message?.includes('operation-not-allowed')) {
          console.warn("Firebase Auth operation-not-allowed, falling back to local staff session");
        } else {
          throw fbErr;
        }
      }

      setUserProfile(profileData);
      setFirebaseUser({ uid: profileData.uid || fallbackUid, email: data.email } as User);
      localStorage.setItem('tl_demo_user', JSON.stringify(profileData));
    } catch (err: any) {
      console.error("Staff sign up error:", err);
      let cleanMsg = err.message;
      if (err.code === 'auth/email-already-in-use') cleanMsg = "An account with this email already exists.";
      setAuthError(cleanMsg);
      setLoading(false);
      throw new Error(cleanMsg);
    } finally {
      setLoading(false);
    }
  };

  // Sign Out
  const signOutUser = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      console.error("Sign out error:", err);
    } finally {
      localStorage.removeItem('tl_demo_user');
      setFirebaseUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  };

  // Owner Function: Approve Pending Staff Account
  const approveStaffAccount = async (staffUid: string) => {
    if (!userProfile || userProfile.role !== 'owner') {
      throw new Error("Unauthorized: Only the salon owner can approve staff accounts.");
    }
    try {
      const staffRef = doc(db, 'users', staffUid);
      await updateDoc(staffRef, {
        status: 'active',
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Firestore approve staff update warning, updating local state:", e);
    }

    setPendingStaffList((prev) => prev.filter((p) => p.id !== staffUid && p.uid !== staffUid));
    setAllProfiles((prev) =>
      prev.map((p) => (p.id === staffUid || p.uid === staffUid ? { ...p, status: 'active' } : p))
    );
  };

  // Owner Function: Disable User Account
  const disableUserAccount = async (targetUid: string) => {
    if (!userProfile || userProfile.role !== 'owner') {
      throw new Error("Unauthorized: Only the salon owner can modify user status.");
    }
    try {
      const targetRef = doc(db, 'users', targetUid);
      await updateDoc(targetRef, {
        status: 'disabled',
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Firestore disable account warning, updating local state:", e);
    }

    setAllProfiles((prev) =>
      prev.map((p) => (p.id === targetUid || p.uid === targetUid ? { ...p, status: 'disabled' } : p))
    );
  };

  // Demo Quick-Login for convenient instant testing
  const demoQuickLogin = async (role: UserRole) => {
    setLoading(true);
    setAuthError(null);
    
    let demoEmail = 'jasmine.customer@truelengths.com';
    let demoName = 'Jasmine R.';
    let demoUid = `demo-${role}-2026`;
    
    if (role === 'stylist') {
      demoEmail = 'stylist.carolyn@truelengths.com';
      demoName = 'Carolyn R.';
    } else if (role === 'owner') {
      demoEmail = 'carolyn.owner@truelengths.com';
      demoName = 'Carolyn R. (Owner)';
    }

    const demoPass = 'TrueLengths2026!';

    const fallbackProfile: UserProfile = {
      id: demoUid,
      uid: demoUid,
      name: demoName,
      email: demoEmail,
      role: role,
      status: 'active',
      salonId: DEFAULT_SALON_ID,
      avatar: role === 'customer'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
        : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      hairType: role === 'customer' ? '4C - High Density Coily' : undefined,
      loyaltyPoints: role === 'customer' ? 350 : undefined,
      loyaltyTier: role === 'customer' ? 'Gold' : undefined,
    };

    try {
      try {
        await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/operation-not-allowed' || signInErr.message?.includes('operation-not-allowed')) {
          setUserProfile(fallbackProfile);
          setFirebaseUser({ uid: demoUid, email: demoEmail } as User);
          localStorage.setItem('tl_demo_user', JSON.stringify(fallbackProfile));
          return;
        }

        // Account doesn't exist yet in Firebase Auth; create it!
        try {
          const cred = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
          const uid = cred.user.uid;

          const profile: UserProfile = {
            ...fallbackProfile,
            id: uid,
            uid: uid,
          };

          try {
            await setDoc(doc(db, 'users', uid), {
              ...profile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (docErr) {
            console.warn("Firestore setDoc warning:", docErr);
          }

          setUserProfile(profile);
          setFirebaseUser(cred.user);
          localStorage.setItem('tl_demo_user', JSON.stringify(profile));
        } catch (createErr: any) {
          if (createErr.code === 'auth/operation-not-allowed' || createErr.message?.includes('operation-not-allowed')) {
            setUserProfile(fallbackProfile);
            setFirebaseUser({ uid: demoUid, email: demoEmail } as User);
            localStorage.setItem('tl_demo_user', JSON.stringify(fallbackProfile));
            return;
          }
          throw createErr;
        }
      }
    } catch (err: any) {
      console.warn("Demo quick login fallback activated:", err.message);
      setUserProfile(fallbackProfile);
      setFirebaseUser({ uid: demoUid, email: demoEmail } as User);
      localStorage.setItem('tl_demo_user', JSON.stringify(fallbackProfile));
    } finally {
      setLoading(false);
    }
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
        demoQuickLogin,
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
