import crypto from 'node:crypto';
import admin from 'firebase-admin';

export function projectId() {
  return process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'demo-smartvenuex';
}

export function functionsBaseUrl() {
  const raw = process.env.FUNCTIONS_EMULATOR_HOST || '127.0.0.1:5001';
  return raw.startsWith('http') ? raw : `http://${raw}`;
}

export function ensureAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: projectId() });
  }
  return admin;
}

export async function getIdTokenForUid(uid) {
  ensureAdmin();
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
  const customToken = await admin.auth().createCustomToken(uid);
  const res = await fetch(
    `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true })
    }
  );
  const json = await res.json();
  if (!json.idToken) {
    throw new Error(`Auth emulator sign-in failed: ${JSON.stringify(json)}`);
  }
  return json.idToken;
}

export async function seedOrder(orderId, userId, data = {}) {
  ensureAdmin();
  await admin
    .firestore()
    .collection('orders')
    .doc(orderId)
    .set({ userId, status: 'pending', total: 100, ...data });
}

export async function seedUser(uid, data = {}) {
  ensureAdmin();
  await admin
    .firestore()
    .collection('users')
    .doc(uid)
    .set({ role: 'attendee', language: 'en', loyaltyPoints: 0, ...data }, { merge: true });
}

export async function seedTicket(ticketId, data = {}) {
  ensureAdmin();
  await admin
    .firestore()
    .collection('tickets')
    .doc(ticketId)
    .set({ isValid: true, ...data }, { merge: true });
}

export async function seedZone(zoneId, data = {}) {
  ensureAdmin();
  await admin
    .firestore()
    .collection('zones')
    .doc(zoneId)
    .set({ name: zoneId, capacity: 100, currentCount: 0, ...data }, { merge: true });
}

export function razorpaySignature(razorpayOrderId, paymentId, secret) {
  return crypto.createHmac('sha256', secret).update(`${razorpayOrderId}|${paymentId}`).digest('hex');
}

export async function invokeCallable(functionName, idToken, data) {
  const base = functionsBaseUrl();
  const pid = projectId();
  const url = `${base}/${pid}/us-central1/${functionName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
    },
    body: JSON.stringify({ data })
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Callable ${functionName} non-JSON response (${res.status}): ${text.slice(0, 500)}`);
  }
  return { status: res.status, body: json };
}
