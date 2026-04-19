import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { requireRole, requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

export const assignResponder = onCall(async (req) => {
  try {
    const { uid: adminUid } = await requireRole(req, ['admin']);
    const alertId = requireString(req.data?.alertId, 'alertId', { min: 3, max: 120 });
    const responderId = requireString(req.data?.responderId, 'responderId', { min: 3, max: 120 });
    const status = requireString(req.data?.status || 'assigned', 'status', { min: 3, max: 40 });

    const responder = await admin.firestore().collection('users').doc(responderId).get();
    if (!responder.exists) return { ok: false, error: 'Responder not found' };
    const responderData = responder.data();
    if (!['admin', 'gate_staff'].includes(responderData.role)) {
      return { ok: false, error: 'Responder must be admin or gate_staff' };
    }

    await admin
      .firestore()
      .collection('sos_alerts')
      .doc(alertId)
      .set(
        {
          responderId,
          status,
          assignedBy: adminUid,
          assignedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );

    if (responderData.fcmToken) {
      await admin.messaging().send({
        token: responderData.fcmToken,
        notification: {
          title: 'New SOS Assignment',
          body: `You have been assigned to SOS alert ${alertId}.`
        }
      });
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
