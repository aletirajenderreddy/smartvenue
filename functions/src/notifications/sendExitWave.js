import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { requireRole, requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

export const sendExitWave = onCall(async (req) => {
  try {
    await requireRole(req, ['admin']);
    const zone = requireString(req.data?.zone || 'A', 'zone', { min: 1, max: 20 }).toUpperCase();
    const message = requireString(req.data?.message || 'Please move to your recommended gate now.', 'message', {
      min: 8,
      max: 300
    });

    const userDocs = await admin.firestore().collection('users').where('role', '==', 'attendee').get();
    const tokens = userDocs.docs
      .map((d) => d.data())
      .filter((u) => {
        const candidates = [u.zoneId, u.seatZone, u.slotId].filter(Boolean).map((v) => String(v).toUpperCase());
        return candidates.some((value) => value === zone || value.endsWith(` ${zone}`) || value.endsWith(`-${zone}`));
      })
      .map((u) => u.fcmToken)
      .filter(Boolean);
    if (tokens.length) {
      await admin.messaging().sendEachForMulticast({ tokens, notification: { title: 'Exit Wave', body: message } });
    }
    return { ok: true, sent: tokens.length };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
