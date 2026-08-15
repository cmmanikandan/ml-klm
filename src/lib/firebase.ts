import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA_HZpOmS-E0V7B5bqE0e_UKYFo02kKW6U",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "manikandan-lathe.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "manikandan-lathe",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "manikandan-lathe.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "712260934204",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:712260934204:web:7444e496eed5eebbaf0139",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MHRFLQ0JS5"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth & Google Auth Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, firebaseSignOut, onAuthStateChanged };
export type { FirebaseUser };

// Analytics
export const analyticsPromise = isSupported().then((supported: boolean) => (supported ? getAnalytics(app) : null));
