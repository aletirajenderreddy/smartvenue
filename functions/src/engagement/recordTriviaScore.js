import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { requireAuth, requireNumber, requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

export const recordTriviaScore = onCall(async (req) => {
  try {
    const uid = requireAuth(req);
    const eventId = requireString(req.data?.eventId || 'demoEvent', 'eventId', { min: 3, max: 100 });
    const points = requireNumber(req.data?.points, 'points', { min: 0, max: 100 });
    const correct = requireNumber(req.data?.correct || 0, 'correct', { min: 0, max: 5 });

    await admin.firestore().runTransaction(async (tx) => {
      const userRef = admin.firestore().collection('users').doc(uid);
      const eventRef = admin.firestore().collection('gamification_events').doc(`${uid}_${eventId}_trivia`);
      const eventSnap = await tx.get(eventRef);
      if (eventSnap.exists) throw new Error('Trivia score already recorded for this event');
      tx.set(eventRef, {
        uid,
        eventId,
        type: 'trivia',
        points,
        correct,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      tx.set(userRef, { loyaltyPoints: admin.firestore.FieldValue.increment(points) }, { merge: true });
    });

    return { ok: true, points };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
