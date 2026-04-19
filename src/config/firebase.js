import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported as messagingSupported } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const app = initializeApp(cfg);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export const messagingPromise = messagingSupported().then((ok) => (ok ? getMessaging(app) : null));
export const analyticsPromise =
  typeof window === 'undefined'
    ? Promise.resolve(null)
    : analyticsSupported().then((ok) => (ok && cfg.measurementId ? getAnalytics(app) : null));
