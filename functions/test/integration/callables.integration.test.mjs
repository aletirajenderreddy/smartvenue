import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureAdmin,
  getIdTokenForUid,
  invokeCallable,
  razorpaySignature,
  seedOrder,
  seedTicket,
  seedUser,
  seedZone
} from './helpers.mjs';

const shouldRun = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST);

test('integration: requires emulators', () => {
  if (!shouldRun) {
    console.log(
      'Skipping integration tests (set FIRESTORE_EMULATOR_HOST + FIREBASE_AUTH_EMULATOR_HOST). Run: npm run test:emulators'
    );
  }
  assert.ok(true);
});

test(
  'processOrder: valid signature sets preparing',
  { skip: !shouldRun },
  async () => {
    process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test-secret-emulator';
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const uid = 'integration-user-process-order';
    const orderId = `int-order-${Date.now()}`;
    const razorpayOrderId = `rzp_order_${Date.now()}`;
    const paymentId = `pay_${Date.now()}`;
    const sig = razorpaySignature(razorpayOrderId, paymentId, secret);

    ensureAdmin();
    await seedUser(uid, { role: 'attendee' });
    await seedOrder(orderId, uid, { total: 250 });
    const idToken = await getIdTokenForUid(uid);

    const { status, body } = await invokeCallable('processOrder', idToken, {
      orderId,
      paymentId,
      razorpayOrderId,
      razorpaySignature: sig,
      total: 250
    });

    assert.equal(status, 200);
    assert.equal(body.result?.ok, true, JSON.stringify(body));
    assert.equal(body.result?.status, 'preparing');

    const snap = await ensureAdmin().firestore().collection('orders').doc(orderId).get();
    assert.equal(snap.data()?.status, 'preparing');
    assert.equal(snap.data()?.razorpaySignatureVerified, true);
  }
);

test(
  'createPaymentOrder: skipped in CI (requires live Razorpay API + key secret)',
  { skip: true },
  async () => {}
);

test(
  'processOrder: replay same payment id fails second time',
  { skip: !shouldRun },
  async () => {
    process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test-secret-emulator';
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const uid = 'integration-user-replay';
    const orderId = `int-replay-${Date.now()}`;
    const razorpayOrderId = `rzp_order_replay_${Date.now()}`;
    const paymentId = `pay_replay_${Date.now()}`;
    const sig = razorpaySignature(razorpayOrderId, paymentId, secret);

    ensureAdmin();
    await seedUser(uid, { role: 'attendee' });
    await seedOrder(orderId, uid, { total: 50 });
    const idToken = await getIdTokenForUid(uid);

    const first = await invokeCallable('processOrder', idToken, {
      orderId,
      paymentId,
      razorpayOrderId,
      razorpaySignature: sig,
      total: 50
    });
    assert.equal(first.body.result?.ok, true, JSON.stringify(first.body));

    const second = await invokeCallable('processOrder', idToken, {
      orderId,
      paymentId,
      razorpayOrderId,
      razorpaySignature: sig,
      total: 50
    });
    assert.equal(second.body.result?.ok, false);
    const err = String(second.body.result?.error || second.body.error?.message || '');
    assert.ok(/replay/i.test(err), `expected replay error, got: ${err}`);
  }
);

test(
  'processOrder: wrong owner rejected',
  { skip: !shouldRun },
  async () => {
    process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test-secret-emulator';
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const ownerUid = 'integration-owner';
    const attackerUid = 'integration-attacker';
    const orderId = `int-owner-${Date.now()}`;
    const razorpayOrderId = `rzp_own_${Date.now()}`;
    const paymentId = `pay_own_${Date.now()}`;
    const sig = razorpaySignature(razorpayOrderId, paymentId, secret);

    ensureAdmin();
    await seedUser(ownerUid, { role: 'attendee' });
    await seedUser(attackerUid, { role: 'attendee' });
    await seedOrder(orderId, ownerUid, { total: 10 });
    const attackerToken = await getIdTokenForUid(attackerUid);

    const { body } = await invokeCallable('processOrder', attackerToken, {
      orderId,
      paymentId,
      razorpayOrderId,
      razorpaySignature: sig,
      total: 10
    });

    assert.equal(body.result?.ok, false);
    assert.match(String(body.result?.error || ''), /ownership|mismatch/i);
  }
);

test(
  'suggestLostFoundMatches: returns structure when Gemini key set',
  { skip: !shouldRun || !process.env.GEMINI_API_KEY },
  async () => {
    const uid = 'integration-user-lf';
    ensureAdmin();
    await seedUser(uid, { role: 'attendee' });
    await ensureAdmin().firestore().collection('lost_items').doc('lost-int-1').set({
      description: 'blue backpack',
      location: 'Gate 2',
      status: 'lost',
      reportedBy: uid
    });
    await ensureAdmin()
      .firestore()
      .collection('lost_items')
      .doc('found-int-1')
      .set({
        description: 'navy backpack near gate',
        location: 'Gate 2 area',
        status: 'found'
      });

    const idToken = await getIdTokenForUid(uid);
    const { status, body } = await invokeCallable('suggestLostFoundMatches', idToken, { itemId: 'lost-int-1' });

    assert.equal(status, 200);
    assert.ok(Array.isArray(body.result?.matches));
  }
);

test(
  'generateQR + validateEntry: gate staff can validate generated QR',
  { skip: !shouldRun },
  async () => {
    const attendeeUid = 'integration-attendee-ticket';
    const gateUid = 'integration-gate-ticket';
    const eventId = 'demoEvent';
    const ticketId = `${attendeeUid}_${eventId}`;
    const zoneId = 'zone-a';

    await seedUser(attendeeUid, { role: 'attendee' });
    await seedUser(gateUid, { role: 'gate_staff' });
    await seedTicket(ticketId, { userId: attendeeUid, eventId, isValid: true });
    await seedZone(zoneId, { capacity: 100, currentCount: 0 });

    const attendeeToken = await getIdTokenForUid(attendeeUid);
    const gateToken = await getIdTokenForUid(gateUid);

    const qrResult = await invokeCallable('generateQR', attendeeToken, {
      userId: attendeeUid,
      eventId,
      slotId: 'slotA'
    });
    assert.equal(qrResult.status, 200);
    assert.equal(qrResult.body.result?.ok, true, JSON.stringify(qrResult.body));

    const validate = await invokeCallable('validateEntry', gateToken, {
      token: qrResult.body.result?.token,
      zoneId
    });
    assert.equal(validate.status, 200);
    assert.equal(validate.body.result?.valid, true, JSON.stringify(validate.body));
  }
);

test(
  'sendEmergency: admin allowed, attendee denied',
  { skip: !shouldRun },
  async () => {
    const adminUid = 'integration-admin-emergency';
    const attendeeUid = 'integration-attendee-emergency';
    await seedUser(adminUid, { role: 'admin' });
    await seedUser(attendeeUid, { role: 'attendee' });

    const adminToken = await getIdTokenForUid(adminUid);
    const attendeeToken = await getIdTokenForUid(attendeeUid);

    const allowed = await invokeCallable('sendEmergency', adminToken, {
      title: 'Emergency Broadcast',
      message: 'Please proceed to nearest safe exit immediately.'
    });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.body.result?.ok, true, JSON.stringify(allowed.body));

    const denied = await invokeCallable('sendEmergency', attendeeToken, {
      title: 'Not Allowed',
      message: 'test message by attendee'
    });
    assert.equal(denied.status, 200);
    assert.equal(denied.body.result?.ok, false);
  }
);

test(
  'sendExitWave: targets by zone model fields',
  { skip: !shouldRun },
  async () => {
    const adminUid = 'integration-admin-exit-wave';
    await seedUser(adminUid, { role: 'admin' });
    await seedUser('integration-zone-user-1', { role: 'attendee', zoneId: 'A' });
    await seedUser('integration-zone-user-2', { role: 'attendee', seatZone: 'A' });
    await seedUser('integration-zone-user-3', { role: 'attendee', slotId: 'A' });

    const adminToken = await getIdTokenForUid(adminUid);
    const res = await invokeCallable('sendExitWave', adminToken, {
      zone: 'A',
      message: 'Exit wave A start now'
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.result?.ok, true, JSON.stringify(res.body));
  }
);

test(
  'manageBusSubscription: user subscribe/unsubscribe lifecycle',
  { skip: !shouldRun },
  async () => {
    const uid = 'integration-transport-user';
    await seedUser(uid, { role: 'attendee' });
    const token = await getIdTokenForUid(uid);

    const sub = await invokeCallable('manageBusSubscription', token, { busId: 'bus-1', action: 'subscribe' });
    assert.equal(sub.status, 200);
    assert.equal(sub.body.result?.ok, true);
    assert.ok(sub.body.result?.busSubscriptions?.includes('bus-1'));

    const unsub = await invokeCallable('manageBusSubscription', token, { busId: 'bus-1', action: 'unsubscribe' });
    assert.equal(unsub.status, 200);
    assert.equal(unsub.body.result?.ok, true);
    assert.ok(!unsub.body.result?.busSubscriptions?.includes('bus-1'));
  }
);
