import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { requireNumber, requireRole, requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

export const sendBusEta = onCall(async (req) => {
  try {
    await requireRole(req, ['admin']);
    const busId = requireString(req.data?.busId, 'busId', { min: 3, max: 120 });
    const eta = requireNumber(req.data?.eta, 'eta', { min: 0, max: 240 });
    const route = requireString(req.data?.route || 'Venue Shuttle', 'route', { min: 3, max: 120 });

    const users = await admin.firestore().collection('users').where('busSubscriptions', 'array-contains', busId).get();
    const tokens = users.docs.map((d) => d.data().fcmToken).filter(Boolean);
    if (tokens.length) {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: `${route} ETA Update`,
          body: `Bus ${busId} arrives in ~${Math.round(eta)} minutes.`
        }
      });
    }
    return { ok: true, sent: tokens.length };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
