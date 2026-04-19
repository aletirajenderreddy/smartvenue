import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { normalizePaymentId, verifyRazorpaySignature } from '../src/food/paymentSecurity.js';

test('verifyRazorpaySignature returns true for matching signature', () => {
  const orderId = 'order_123';
  const paymentId = 'pay_456';
  const secret = 'test_secret';
  const signature = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  assert.equal(verifyRazorpaySignature(orderId, paymentId, signature, secret), true);
});

test('verifyRazorpaySignature returns false for mismatched signature', () => {
  assert.equal(verifyRazorpaySignature('order_a', 'pay_b', 'bad_sig', 'secret'), false);
});

test('normalizePaymentId trims and lowercases values', () => {
  assert.equal(normalizePaymentId('  PAY_ABC  '), 'pay_abc');
});
