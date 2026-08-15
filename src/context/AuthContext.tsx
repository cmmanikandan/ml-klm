import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { auth, googleProvider, signInWithPopup, firebaseSignOut, onAuthStateChanged, FirebaseUser } from '../lib/firebase';
import { useLanguage } from './LanguageContext';

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
        return JSON.parse(savedUser);
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
    // Read local cache to preserve onboarding status across refreshes
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

      if (data && !error && data.is_profile_completed) {
        const mergedProfile = { ...cachedProfile, ...data, is_profile_completed: true };
        setUser(mergedProfile);
        localStorage.setItem('ml_user_profile', JSON.stringify(mergedProfile));
        if (mergedProfile.language) setLanguage(mergedProfile.language);
      } else if (cachedProfile && cachedProfile.id === fbUser.uid && cachedProfile.is_profile_completed) {
        // Local cache has completed onboarding -> keep it active and sync to Supabase
        setUser(cachedProfile);
        localStorage.setItem('ml_user_profile', JSON.stringify(cachedProfile));
        await supabase.from('profiles').upsert(cachedProfile);
      } else {
        // New user profile init
        const newProfile: Profile = {
          id: fbUser.uid,
          full_name: fbUser.displayName || cachedProfile?.full_name || 'Customer',
          email: fbUser.email || cachedProfile?.email || '',
          avatar_url: fbUser.photoURL || cachedProfile?.avatar_url || undefined,
          language: cachedProfile?.language || 'en',
          role: cachedProfile?.role || 'customer',
          is_profile_completed: cachedProfile?.is_profile_completed || false,
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
        setUser(cachedProfile);
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
    const updated: Profile = { 
      ...user, 
      ...data, 
      is_profile_completed: data.is_profile_completed !== undefined ? data.is_profile_completed : user.is_profile_completed,
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
        full_name: role === 'admin' ? 'Shop Admin' : 'Customer',
        email: role === 'admin' ? 'admin@manikandanlathe.com' : 'customer@manikandanlathe.com',
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

  const isAdmin = user?.role === 'admin';
  const needsOnboarding = Boolean(user && !user.is_profile_completed);

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
