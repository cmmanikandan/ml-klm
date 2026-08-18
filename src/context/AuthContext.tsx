import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  firebaseSignOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateFirebaseProfile,
  FirebaseUser 
} from '../lib/firebase';
import { useLanguage } from './LanguageContext';

export const MASTER_ADMIN_UIDS = ['9QFtBzZ3Z8f2f8QH4bxgkn4sXVq1'];
export const MASTER_ADMIN_EMAILS = ['manikandanlatheklm@gmail.com'];

export const checkIsAdmin = (u: any): boolean => {
  if (!u) return false;
  if (u.role === 'admin') return true;
  if (u.is_admin === true) return true;
  if (u.id && MASTER_ADMIN_UIDS.includes(u.id)) return true;
  if (u.uid && MASTER_ADMIN_UIDS.includes(u.uid)) return true;
  if (u.email && MASTER_ADMIN_EMAILS.includes(String(u.email).toLowerCase().trim())) return true;
  return false;
};

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  needsOnboarding: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string, lang?: 'en' | 'ta') => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName?: string, lang?: 'en' | 'ta') => Promise<{ success: boolean; error?: string }>;
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
        const isMaster = checkIsAdmin(parsed);
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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to live Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        await syncFirebaseUserWithSupabase(firebaseUser);
      } else {
        const savedUser = localStorage.getItem('ml_user_profile');
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (checkIsAdmin(parsed)) {
              setUser({ ...parsed, role: 'admin', is_profile_completed: true });
            } else {
              setUser(parsed);
            }
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const syncFirebaseUserWithSupabase = async (fbUser: FirebaseUser) => {
    const isMasterAdmin = checkIsAdmin(fbUser);

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
          full_name: fbUser.displayName || cachedProfile?.full_name || (isMasterAdmin ? 'MANIKANDAN LATHE Admin' : 'Customer'),
          email: fbUser.email || cachedProfile?.email || 'manikandanlatheklm@gmail.com',
          avatar_url: fbUser.photoURL || cachedProfile?.avatar_url || undefined,
          language: cachedProfile?.language || 'en',
          role: isMasterAdmin ? 'admin' : 'customer',
          is_profile_completed: isMasterAdmin ? true : false,
          phone: cachedProfile?.phone || undefined,
          address: cachedProfile?.address || undefined,
          city_area: cachedProfile?.city_area || undefined
        };

        setUser(newProfile);
        localStorage.setItem('ml_user_profile', JSON.stringify(newProfile));
        await supabase.from('profiles').upsert(newProfile);
      }
    } catch (e) {
      const fallbackProfile: Profile = {
        id: fbUser.uid,
        full_name: fbUser.displayName || (isMasterAdmin ? 'MANIKANDAN LATHE Admin' : 'Customer'),
        email: fbUser.email || 'manikandanlatheklm@gmail.com',
        avatar_url: fbUser.photoURL || undefined,
        language: 'en',
        role: isMasterAdmin ? 'admin' : 'customer',
        is_profile_completed: isMasterAdmin ? true : false
      };
      setUser(fallbackProfile);
      localStorage.setItem('ml_user_profile', JSON.stringify(fallbackProfile));
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

  // Email & Password Sign-In (Strict credential validation)
  const signInWithEmail = async (
    email: string,
    password: string,
    lang: 'en' | 'ta' = 'en'
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const isTa = lang === 'ta';

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      if (userCredential.user) {
        await syncFirebaseUserWithSupabase(userCredential.user);
        return { success: true };
      }
      return {
        success: false,
        error: isTa
          ? 'உள்நுழைய முடியவில்லை. மின்னஞ்சல் மற்றும் கடவுச்சொல்லை சரிபார்க்கவும்.'
          : 'Failed to sign in. Please check your credentials.'
      };
    } catch (err: any) {
      console.warn('Firebase Email Sign-In error:', err?.code, err?.message);

      let msg = isTa
        ? 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல். தயவுசெய்து சரிபார்க்கவும்.'
        : 'Invalid email or password. Please check and try again.';

      if (err?.code === 'auth/user-not-found') {
        msg = isTa
          ? 'இந்த மின்னஞ்சலில் கணக்கு ஏதும் இல்லை. தயவுசெய்து முதலில் புதிய கணக்கை உருவாக்கவும் (Sign Up).'
          : 'No account found with this email. Please create an account first (Sign Up).';
      } else if (err?.code === 'auth/wrong-password') {
        msg = isTa
          ? 'தவறான கடவுச்சொல். தயவுசெய்து சரியான கடவுச்சொல்லை உள்ளிடவும்.'
          : 'Incorrect password. Please enter the correct password.';
      } else if (err?.code === 'auth/invalid-credential') {
        msg = isTa
          ? 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல். நீங்கள் இன்னும் பதிவு செய்யவில்லை என்றால் Sign Up செய்யவும்.'
          : 'Invalid email or password. If you do not have an account yet, please Sign Up.';
      } else if (err?.code === 'auth/invalid-email') {
        msg = isTa
          ? 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.'
          : 'Please enter a valid email address.';
      } else if (err?.code === 'auth/user-disabled') {
        msg = isTa
          ? 'இந்த பயனர் கணக்கு முடக்கப்பட்டுள்ளது.'
          : 'This user account has been disabled.';
      } else if (err?.code === 'auth/too-many-requests') {
        msg = isTa
          ? 'பலமுறை தவறாக முயற்சிக்கப்பட்டுள்ளது. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
          : 'Too many failed login attempts. Please try again in a few moments.';
      } else if (err?.code === 'auth/network-request-failed') {
        msg = isTa
          ? 'இணைய இணைப்பு பிழை. உங்கள் இணையத்தை சரிபார்க்கவும்.'
          : 'Network error. Please check your internet connection.';
      }

      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Email & Password Sign-Up (Strict account registration)
  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName?: string,
    lang: 'en' | 'ta' = 'en'
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const displayName = fullName?.trim() || cleanEmail.split('@')[0];
    const isTa = lang === 'ta';

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      if (userCredential.user) {
        try {
          await updateFirebaseProfile(userCredential.user, {
            displayName: displayName
          });
        } catch (e) {}

        await syncFirebaseUserWithSupabase(userCredential.user);
        return { success: true };
      }
      return {
        success: false,
        error: isTa ? 'கணக்கு உருவாக்க முடியவில்லை.' : 'Registration failed. Please try again.'
      };
    } catch (err: any) {
      console.warn('Firebase Email Sign-Up error:', err?.code, err?.message);

      let msg = isTa
        ? 'கணக்கு உருவாக்க முடியவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
        : 'Registration failed. Please try again.';

      if (err?.code === 'auth/email-already-in-use') {
        msg = isTa
          ? 'இந்த மின்னஞ்சலில் ஏற்கனவே கணக்கு உள்ளது. தயவுசெய்து உள்நுழையவும் (Sign In).'
          : 'An account already exists with this email. Please sign in instead (Sign In).';
      } else if (err?.code === 'auth/weak-password') {
        msg = isTa
          ? 'கடவுச்சொல் மிகவும் எளிமையாக உள்ளது. குறைந்தது 6 எழுத்துகள் பயன்படுத்தவும்.'
          : 'Password is too weak. Please use at least 6 characters.';
      } else if (err?.code === 'auth/invalid-email') {
        msg = isTa
          ? 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.'
          : 'Please enter a valid email address.';
      } else if (err?.code === 'auth/network-request-failed') {
        msg = isTa
          ? 'இணைய இணைப்பு பிழை. உங்கள் இணையத்தை சரிபார்க்கவும்.'
          : 'Network error. Please check your internet connection.';
      }

      return { success: false, error: msg };
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
    localStorage.removeItem('ml_orders');
    localStorage.removeItem('ml_enquiries');
    localStorage.removeItem('ml_wishlist');
    localStorage.removeItem('ml_notifications');
    localStorage.removeItem('ml_recently_viewed');
    localStorage.removeItem('ml_read_notification_ids');
    localStorage.removeItem('ml_deleted_notification_ids');
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;
    const isMasterAdmin = checkIsAdmin(user) || checkIsAdmin(data);

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

  const isAdmin = Boolean(user && checkIsAdmin(user));

  const needsOnboarding = Boolean(
    user && 
    !user.is_profile_completed && 
    !checkIsAdmin(user)
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        needsOnboarding,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
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
