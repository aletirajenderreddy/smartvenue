import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

export const manageBusSubscription = onCall(async (req) => {
  try {
    if (!req.auth?.uid) return { ok: false, error: 'Authentication required' };
    const busId = requireString(req.data?.busId, 'busId', { min: 3, max: 120 });
    const action = requireString(req.data?.action || 'subscribe', 'action', { min: 3, max: 20 }).toLowerCase();
    if (!['subscribe', 'unsubscribe'].includes(action)) return { ok: false, error: 'Invalid action' };

    const uid = req.auth.uid;
    const userRef = admin.firestore().collection('users').doc(uid);
    const userSnap = await userRef.get();
    const current = userSnap.data()?.busSubscriptions || [];
    const next =
      action === 'subscribe' ? Array.from(new Set([...current, busId])) : current.filter((id) => id !== busId);

    await userRef.set({ busSubscriptions: next }, { merge: true });
    return { ok: true, busSubscriptions: next };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
