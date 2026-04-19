import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { distanceKm, optionalString, requireAuth, requireEnum, requireNumber } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

const ALERT_TYPES = ['SOS', 'Medical Emergency', 'Fire', 'Missing Person'];

export const createSosAlert = onCall(async (req) => {
  try {
    const uid = requireAuth(req);
    const lat = requireNumber(req.data?.lat, 'lat', { min: -90, max: 90 });
    const lng = requireNumber(req.data?.lng, 'lng', { min: -180, max: 180 });
    const type = requireEnum(req.data?.type || 'SOS', 'type', ALERT_TYPES);
    const message = optionalString(req.data?.message || type, 'message', { max: 300, fallback: type });

    const db = admin.firestore();
    const staffSnap = await db.collection('users').where('role', 'in', ['admin', 'gate_staff']).get();
    const staff = staffSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const here = { lat, lng };
        return distanceKm(here, { lat: a.lastLat, lng: a.lastLng }) - distanceKm(here, { lat: b.lastLat, lng: b.lastLng });
      });

    const responder = staff[0] || null;
    const alertRef = await db.collection('sos_alerts').add({
      userId: uid,
      lat,
      lng,
      type,
      message,
      status: responder ? 'assigned' : 'open',
      responderId: responder?.id || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (responder?.fcmToken) {
      await admin.messaging().send({
        token: responder.fcmToken,
        notification: {
          title: `${type} near your zone`,
          body: message
        },
        data: {
          alertId: alertRef.id,
          type
        }
      });
    }

    return { ok: true, alertId: alertRef.id, responderId: responder?.id || null };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
