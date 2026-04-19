import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { densityLevel, requireBoolean, requireNumber, requireRole, requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

export const updateZoneControl = onCall(async (req) => {
  try {
    await requireRole(req, ['admin']);
    const zoneId = requireString(req.data?.zoneId, 'zoneId', { min: 2, max: 100 });
    const patch = {};

    if (req.data?.currentCount != null) {
      patch.currentCount = requireNumber(req.data.currentCount, 'currentCount', { min: 0, max: 250000 });
    }
    if (req.data?.capacity != null) {
      patch.capacity = requireNumber(req.data.capacity, 'capacity', { min: 1, max: 250000 });
    }
    if (req.data?.isClosed != null) {
      patch.isClosed = requireBoolean(req.data.isClosed, 'isClosed');
    }

    const zoneRef = admin.firestore().collection('zones').doc(zoneId);
    const zoneSnap = await zoneRef.get();
    if (!zoneSnap.exists) return { ok: false, error: 'Zone not found' };
    const zone = zoneSnap.data();
    const nextCount = patch.currentCount ?? zone.currentCount ?? 0;
    const nextCapacity = patch.capacity ?? zone.capacity ?? 1;

    await zoneRef.set(
      {
        ...patch,
        densityLevel: densityLevel(nextCount, nextCapacity),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    if (patch.isClosed === true) {
      const users = await admin.firestore().collection('users').where('seatZone', '==', zone.name || zoneId).get();
      const tokens = users.docs.map((d) => d.data().fcmToken).filter(Boolean);
      if (tokens.length) {
        await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: 'Zone closed',
            body: `${zone.name || zoneId} is temporarily closed. Follow the in-app route update.`
          },
          data: { zoneId, action: 'redirect' }
        });
      }
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
