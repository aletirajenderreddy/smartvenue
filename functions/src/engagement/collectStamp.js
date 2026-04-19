import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { requireAuth, requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

const HOTSPOTS = ['gate-a', 'zone-b', 'heritage-wall', 'fan-zone', 'merch-hub'];

export const collectStamp = onCall(async (req) => {
  try {
    const uid = requireAuth(req);
    const hotspotId = requireString(req.data?.hotspotId, 'hotspotId', { min: 3, max: 80 });
    if (!HOTSPOTS.includes(hotspotId)) return { ok: false, error: 'Unknown hotspot' };

    const result = await admin.firestore().runTransaction(async (tx) => {
      const userRef = admin.firestore().collection('users').doc(uid);
      const snap = await tx.get(userRef);
      const user = snap.exists ? snap.data() : {};
      const stamps = Array.from(new Set([...(user.stamps || []), hotspotId]));
      const completed = HOTSPOTS.every((id) => stamps.includes(id));
      const alreadyCompleted = Boolean(user.souvenirUnlocked);
      const bonus = completed && !alreadyCompleted ? 50 : 5;
      tx.set(
        userRef,
        {
          stamps,
          souvenirUnlocked: completed,
          loyaltyPoints: admin.firestore.FieldValue.increment(bonus),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );
      return { stamps, completed, pointsAwarded: bonus };
    });

    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
