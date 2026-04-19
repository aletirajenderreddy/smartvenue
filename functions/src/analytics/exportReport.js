import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { requireRole, requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

export const exportReport = onCall(async (req) => {
  try {
    await requireRole(req, ['admin']);
    const eventId = requireString(req.data?.eventId || 'demoEvent', 'eventId', { min: 3, max: 100 });
    const rows = ['userId,eventId,rating,crowdRating,foodRating,sentiment'];
    const docs = (await admin.firestore().collection('feedback').where('eventId', '==', eventId).get()).docs;
    docs.forEach((d) => {
      const f = d.data();
      rows.push(`${f.userId},${f.eventId},${f.rating},${f.crowdRating},${f.foodRating},${f.sentiment}`);
    });
    return { ok: true, csv: rows.join('\n') };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
