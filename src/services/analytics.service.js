import { doc, setDoc } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { db, messagingPromise } from '../config/firebase';

export async function setupFCM(uid) {
  const messaging = await messagingPromise;
  if (!messaging) return null;
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  const token = await getToken(messaging, vapidKey ? { vapidKey } : undefined).catch(() => null);
  if (token) {
    await setDoc(doc(db, 'users', uid), { fcmToken: token }, { merge: true });
  }
  onMessage(messaging, () => {});
  return token;
}

export function logAnalytics(name, data) {
  console.info(`[analytics] ${name}`, data);
}
