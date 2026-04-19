import crypto from 'node:crypto';

export function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  const providedBuffer = Buffer.from(String(signature), 'hex');
  return expectedBuffer.length === providedBuffer.length && crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

export function normalizePaymentId(paymentId) {
  return String(paymentId || '').trim().toLowerCase();
}
