import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { requireRole, requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

export const sendEmergency = onCall(async (req) => {
  try {
    await requireRole(req, ['admin']);
    const message = requireString(
      req.data?.message || 'Emergency alert: follow evacuation instructions immediately.',
      'message',
      { min: 10, max: 300 }
    );
    const title = requireString(req.data?.title || 'Emergency Broadcast', 'title', { min: 3, max: 80 });

    const users = await admin.firestore().collection('users').where('role', '==', 'attendee').get();
    const tokens = users.docs.map((d) => d.data().fcmToken).filter(Boolean);
    if (tokens.length) {
      await admin.messaging().sendEachForMulticast({ tokens, notification: { title, body: message } });
    }
    return { ok: true, sent: tokens.length };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
