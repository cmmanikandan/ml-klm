import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { auth, googleProvider, signInWithPopup, firebaseSignOut, onAuthStateChanged, FirebaseUser } from '../lib/firebase';
import { useLanguage } from './LanguageContext';

export const MASTER_ADMIN_UIDS = ['9QFtBzZ3Z8f2f8QH4bxgkn4sXVq1'];
export const MASTER_ADMIN_EMAILS = ['manikandanlatheklm@gmail.com'];

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  needsOnboarding: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  completeOnboarding: (data: { full_name: string; phone: string; address: string; city_area: string; language: 'en' | 'ta' }) => Promise<void>;
  switchUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setLanguage } = useLanguage();

  // Load initial cached profile from localStorage
  const [user, setUser] = useState<Profile | null>(() => {
    const savedUser = localStorage.getItem('ml_user_profile');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        const isMaster = (parsed.id && MASTER_ADMIN_UIDS.includes(parsed.id)) || (parsed.email && MASTER_ADMIN_EMAILS.includes(parsed.email));
        if (parsed && isMaster) {
          return { ...parsed, role: 'admin', is_profile_completed: true };
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen to live Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        await syncFirebaseUserWithSupabase(firebaseUser);
      } else {
        const savedUser = localStorage.getItem('ml_user_profile');
        if (!savedUser) {
          setUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const syncFirebaseUserWithSupabase = async (fbUser: FirebaseUser) => {
    const isMasterAdmin = MASTER_ADMIN_UIDS.includes(fbUser.uid) || MASTER_ADMIN_EMAILS.includes(fbUser.email || '');

    // Read local cache
    const cachedStr = localStorage.getItem('ml_user_profile');
    let cachedProfile: Profile | null = null;
    if (cachedStr) {
      try {
        cachedProfile = JSON.parse(cachedStr);
      } catch (e) {
        // ignore
      }
    }

    try {
      // Fetch profile from Supabase PostgreSQL database
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', fbUser.uid)
        .single();

      if (data && !error) {
        const mergedProfile: Profile = {
          ...cachedProfile,
          ...data,
          email: fbUser.email || data.email || cachedProfile?.email || 'manikandanlatheklm@gmail.com',
          role: isMasterAdmin ? 'admin' : (data.role || 'customer'),
          is_profile_completed: isMasterAdmin ? true : (data.is_profile_completed || false)
        };

        setUser(mergedProfile);
        localStorage.setItem('ml_user_profile', JSON.stringify(mergedProfile));
        if (mergedProfile.language) setLanguage(mergedProfile.language);
      } else {
        // New user profile init
        const newProfile: Profile = {
          id: fbUser.uid,
          full_name: fbUser.displayName || cachedProfile?.full_name || (isMasterAdmin ? 'Shop Owner' : 'Customer'),
          email: fbUser.email || cachedProfile?.email || 'manikandanlatheklm@gmail.com',
          avatar_url: fbUser.photoURL || cachedProfile?.avatar_url || undefined,
          language: cachedProfile?.language || 'en',
          role: isMasterAdmin ? 'admin' : 'customer',
          is_profile_completed: isMasterAdmin ? true : (cachedProfile?.is_profile_completed || false),
          phone: cachedProfile?.phone || undefined,
          address: cachedProfile?.address || undefined,
          city_area: cachedProfile?.city_area || undefined
        };

        setUser(newProfile);
        localStorage.setItem('ml_user_profile', JSON.stringify(newProfile));
        await supabase.from('profiles').upsert(newProfile);
      }
    } catch (e) {
      if (cachedProfile) {
        const merged = {
          ...cachedProfile,
          email: fbUser.email || cachedProfile.email,
          role: isMasterAdmin ? 'admin' : cachedProfile.role
        };
        setUser(merged);
      }
    }
  };

  // Live Firebase Google Sign-In
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncFirebaseUserWithSupabase(result.user);
      }
    } catch (err) {
      console.warn('Firebase Sign-In error:', err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // Ignore
    }
    setUser(null);
    localStorage.removeItem('ml_user_profile');
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;
    const isMasterAdmin = MASTER_ADMIN_UIDS.includes(user.id) || MASTER_ADMIN_EMAILS.includes(user.email || '');

    const updated: Profile = { 
      ...user, 
      ...data, 
      role: isMasterAdmin ? 'admin' : (data.role || user.role),
      is_profile_completed: isMasterAdmin ? true : (data.is_profile_completed !== undefined ? data.is_profile_completed : user.is_profile_completed),
      updated_at: new Date().toISOString() 
    };
    
    setUser(updated);
    localStorage.setItem('ml_user_profile', JSON.stringify(updated));

    if (data.language) setLanguage(data.language);

    try {
      await supabase.from('profiles').upsert(updated);
    } catch (e) {
      console.warn('Supabase profile upsert synced locally');
    }
  };

  const completeOnboarding = async (data: {
    full_name: string;
    phone: string;
    address: string;
    city_area: string;
    language: 'en' | 'ta';
  }) => {
    await updateProfile({
      ...data,
      is_profile_completed: true
    });
  };

  const switchUserRole = (role: UserRole) => {
    if (!user) {
      const roleProfile: Profile = {
        id: `admin_${Date.now()}`,
        full_name: role === 'admin' ? 'MANIKANDAN LATHE Admin' : 'Customer',
        email: 'manikandanlatheklm@gmail.com',
        language: 'en',
        role: role,
        is_profile_completed: true
      };
      setUser(roleProfile);
      localStorage.setItem('ml_user_profile', JSON.stringify(roleProfile));
      return;
    }
    updateProfile({ role });
  };

  const isAdmin = Boolean(
    user && (
      user.role === 'admin' || 
      MASTER_ADMIN_UIDS.includes(user.id) || 
      MASTER_ADMIN_EMAILS.includes(user.email || '')
    )
  );

  const needsOnboarding = Boolean(
    user && 
    !user.is_profile_completed && 
    !MASTER_ADMIN_UIDS.includes(user.id) &&
    !MASTER_ADMIN_EMAILS.includes(user.email || '')
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        needsOnboarding,
        signInWithGoogle,
        signOut,
        updateProfile,
        completeOnboarding,
        switchUserRole
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
