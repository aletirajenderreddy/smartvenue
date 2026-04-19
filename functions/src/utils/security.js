import admin from 'firebase-admin';

const ROLE_VALUES = ['attendee', 'admin', 'gate_staff'];

export async function getUserRole(uid) {
  if (!uid) return null;
  const snap = await admin.firestore().collection('users').doc(uid).get();
  return snap.exists ? snap.data()?.role || null : null;
}

export function requireAuth(req) {
  if (!req.auth?.uid) throw new Error('Authentication required');
  return req.auth.uid;
}

export async function requireRole(req, allowedRoles) {
  requireAuth(req);
  const role = await getUserRole(req.auth.uid);
  if (!allowedRoles.includes(role)) {
    throw new Error(`Insufficient role: required ${allowedRoles.join(', ')}`);
  }
  return { uid: req.auth.uid, role };
}

export function requireString(value, field, { min = 1, max = 500 } = {}) {
  const text = String(value ?? '').trim();
  if (text.length < min || text.length > max) {
    throw new Error(`${field} must be between ${min} and ${max} characters`);
  }
  return text;
}

export function requireNumber(value, field, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < min || num > max) {
    throw new Error(`${field} must be a valid number between ${min} and ${max}`);
  }
  return num;
}

export function requireBoolean(value, field) {
  if (typeof value !== 'boolean') {
    throw new Error(`${field} must be true or false`);
  }
  return value;
}

export function requireEnum(value, field, allowed) {
  const text = requireString(value, field, { min: 1, max: 80 });
  if (!allowed.includes(text)) {
    throw new Error(`${field} must be one of ${allowed.join(', ')}`);
  }
  return text;
}

export function optionalString(value, field, { max = 500, fallback = '' } = {}) {
  if (value == null || value === '') return fallback;
  return requireString(value, field, { min: 0, max });
}

export function requireArray(value, field, { max = 100 } = {}) {
  if (!Array.isArray(value) || value.length > max) {
    throw new Error(`${field} must be an array with at most ${max} items`);
  }
  return value;
}

export function requireRoleValue(value, field = 'role') {
  return requireEnum(value, field, ROLE_VALUES);
}

export function densityLevel(currentCount, capacity) {
  const ratio = Number(capacity || 0) > 0 ? Number(currentCount || 0) / Number(capacity || 1) : 0;
  if (ratio > 0.9) return 'critical';
  if (ratio > 0.7) return 'high';
  if (ratio > 0.4) return 'medium';
  return 'low';
}

export function toMillis(value) {
  if (!value) return null;
  if (typeof value.toMillis === 'function') return value.toMillis();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function distanceKm(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const lat1 = Number(a.lat);
  const lng1 = Number(a.lng);
  const lat2 = Number(b.lat);
  const lng2 = Number(b.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return Number.POSITIVE_INFINITY;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(s1 + s2), Math.sqrt(1 - s1 - s2));
}
