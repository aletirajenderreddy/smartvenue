import { onCall } from 'firebase-functions/v2/https';
import Razorpay from 'razorpay';
import { requireNumber } from '../utils/security.js';

export const createPaymentOrder = onCall(async (req) => {
  try {
    if (!req.auth?.uid) return { ok: false, error: 'Authentication required' };
    const total = requireNumber(req.data?.total, 'total', { min: 1, max: 100000 });

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_demo';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    if (!keySecret) return { ok: false, error: 'Razorpay secret not configured' };

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: `svx_${Date.now()}`
    });

    return { ok: true, keyId, orderId: order.id, amount: order.amount, currency: order.currency };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
