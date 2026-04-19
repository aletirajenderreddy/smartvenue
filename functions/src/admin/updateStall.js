import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { requireBoolean, requireNumber, requireRole, requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

export const updateStall = onCall(async (req) => {
  try {
    await requireRole(req, ['admin', 'gate_staff']);
    const stallId = requireString(req.data?.stallId, 'stallId', { min: 3, max: 120 });
    const patch = {};

    if (req.data?.isOpen != null) patch.isOpen = requireBoolean(req.data.isOpen, 'isOpen');
    if (req.data?.waitMinutes != null) patch.waitMinutes = requireNumber(req.data.waitMinutes, 'waitMinutes', { min: 0, max: 240 });
    if (req.data?.name != null) patch.name = requireString(req.data.name, 'name', { min: 2, max: 120 });
    if (req.data?.category != null) patch.category = requireString(req.data.category, 'category', { min: 2, max: 80 });

    await admin
      .firestore()
      .collection('stalls')
      .doc(stallId)
      .set({ ...patch, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
