import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import { normalizePaymentId, verifyRazorpaySignature } from './paymentSecurity.js';
import { requireNumber, requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

export const processOrder = onCall(async (req) => {
  try {
    const orderId = requireString(req.data?.orderId, 'orderId', { min: 3, max: 120 });
    const paymentId = requireString(req.data?.paymentId, 'paymentId', { min: 3, max: 200 });
    const razorpayOrderId = requireString(req.data?.razorpayOrderId, 'razorpayOrderId', { min: 3, max: 200 });
    const razorpaySignature = requireString(req.data?.razorpaySignature, 'razorpaySignature', { min: 16, max: 500 });
    const total = requireNumber(req.data?.total, 'total', { min: 1, max: 100000 });

    if (!req.auth?.uid) return { ok: false, error: 'Authentication required' };

    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const verified = verifyRazorpaySignature(razorpayOrderId, paymentId, razorpaySignature, secret);
    const paymentKey = normalizePaymentId(paymentId);

    if (!verified) {
      await admin.firestore().collection('orders').doc(orderId).set(
        {
          total: Number(total || 0),
          paymentId: paymentId || null,
          razorpayOrderId: razorpayOrderId || null,
          razorpaySignatureVerified: false,
          status: 'pending'
        },
        { merge: true }
      );
      return { ok: false, status: 'pending' };
    }

    await admin.firestore().runTransaction(async (tx) => {
      const orderRef = admin.firestore().collection('orders').doc(orderId);
      const paymentRef = admin.firestore().collection('processed_payments').doc(paymentKey);
      const [orderSnap, paymentSnap] = await Promise.all([tx.get(orderRef), tx.get(paymentRef)]);

      if (!orderSnap.exists) throw new Error('Order not found');
      const orderData = orderSnap.data();
      if (orderData.userId !== req.auth.uid) throw new Error('Order ownership mismatch');
      if (paymentSnap.exists) throw new Error('Replay payment detected');
      if (Number(orderData.total || 0) !== Number(total)) throw new Error('Order total mismatch');
      if (orderData.status === 'preparing' || orderData.status === 'ready' || orderData.status === 'collected') {
        throw new Error('Order already paid/processed');
      }
      const collectionToken = jwt.sign(
        { orderId, userId: req.auth.uid, purpose: 'food_collection' },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '12h' }
      );

      tx.set(paymentRef, {
        orderId,
        paymentId: paymentKey,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: req.auth.uid
      });

      tx.set(
        orderRef,
        {
          total: Number(total || orderData.total || 0),
          paymentId: paymentId || null,
          razorpayOrderId: razorpayOrderId || null,
          razorpaySignatureVerified: true,
          qrToken: collectionToken,
          status: 'preparing',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );
    });
  } catch (error) {
    return { ok: false, error: error.message, status: 'pending' };
  }

  return { ok: true, status: 'preparing' };
});
