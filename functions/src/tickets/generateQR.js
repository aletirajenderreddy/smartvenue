import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import { requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

export const generateQR = onCall(async (req) => {
  try {
    if (!req.auth?.uid) return { ok: false, error: 'Authentication required' };

    const userId = requireString(req.data?.userId, 'userId', { min: 3, max: 100 });
    const eventId = requireString(req.data?.eventId, 'eventId', { min: 3, max: 100 });
    const slotId = requireString(req.data?.slotId, 'slotId', { min: 1, max: 100 });

    const requesterRole = (await admin.firestore().collection('users').doc(req.auth.uid).get()).data()?.role;
    const requesterIsAdmin = requesterRole === 'admin';
    if (!requesterIsAdmin && req.auth.uid !== userId) {
      return { ok: false, error: 'Cannot generate ticket for another user' };
    }

    const ticketRef = admin.firestore().collection('tickets').doc(`${userId}_${eventId}`);
    const ticketSnap = await ticketRef.get();
    if (!ticketSnap.exists) {
      return { ok: false, error: 'Ticket does not exist for this user and event' };
    }

    const token = jwt.sign({ userId, eventId, slotId }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '24h' });
    await ticketRef.set({ qrToken: token, slotId, slotTime: slotId, isValid: true }, { merge: true });
    return { ok: true, token, ticketId: ticketRef.id };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
