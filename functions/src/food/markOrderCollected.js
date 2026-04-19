import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import { requireEnum, requireRole, requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

export const markOrderCollected = onCall(async (req) => {
  try {
    const { uid } = await requireRole(req, ['admin', 'gate_staff']);
    const orderId = requireString(req.data?.orderId, 'orderId', { min: 3, max: 120 });
    const status = requireEnum(req.data?.status || 'collected', 'status', ['preparing', 'ready', 'collected']);
    const token = req.data?.token ? requireString(req.data.token, 'token', { min: 10, max: 5000 }) : null;

    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      if (payload.orderId !== orderId) throw new Error('Order QR does not match order');
    }

    const orderRef = admin.firestore().collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return { ok: false, error: 'Order not found' };
    const order = orderSnap.data();
    if (!['preparing', 'ready', 'collected'].includes(order.status)) {
      return { ok: false, error: 'Order has not been paid' };
    }

    const update = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    if (status === 'ready') {
      update.readyAt = admin.firestore.FieldValue.serverTimestamp();
      update.qrToken =
        order.qrToken ||
        jwt.sign({ orderId, userId: order.userId, purpose: 'food_collection' }, process.env.JWT_SECRET || 'dev-secret', {
          expiresIn: '12h'
        });
    }
    if (status === 'collected') {
      update.collectedAt = admin.firestore.FieldValue.serverTimestamp();
      update.collectedBy = uid;
    }

    await orderRef.set(update, { merge: true });

    if (status === 'ready') {
      const user = await admin.firestore().collection('users').doc(order.userId).get();
      const fcmToken = user.data()?.fcmToken;
      if (fcmToken) {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: 'Food order ready',
            body: 'Show your collection QR at the stall.'
          },
          data: { orderId }
        });
      }
    }

    return { ok: true, status };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
