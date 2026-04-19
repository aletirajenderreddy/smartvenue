import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

export const sendArrivalAlert = onCall(async (req) => {
  try {
    if (!req.auth?.uid) return { ok: false, error: 'Authentication required' };
    const body = requireString(req.data?.message || 'Your gate slot starts in 20 minutes.', 'message', { min: 8, max: 200 });
    const title = requireString(req.data?.title || 'Arrival Slot Reminder', 'title', { min: 3, max: 80 });

    const token = (await admin.firestore().collection('users').doc(req.auth.uid).get()).data()?.fcmToken;
    if (token) {
      await admin.messaging().send({ token, notification: { title, body } });
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
