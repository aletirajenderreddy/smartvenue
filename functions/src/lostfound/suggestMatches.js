import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

function cosine(a, b) {
  const dot = a.reduce((s, v, i) => s + v * (b[i] || 0), 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  if (!na || !nb) return 0;
  return dot / (na * nb);
}

export const suggestLostFoundMatches = onCall(async (req) => {
  try {
    if (!req.auth?.uid) return { ok: false, error: 'Authentication required' };
    const itemId = requireString(req.data?.itemId, 'itemId', { min: 3, max: 120 });

    const lostSnap = await admin.firestore().collection('lost_items').doc(itemId).get();
    if (!lostSnap.exists) return { ok: false, error: 'lost item not found' };
    const lost = lostSnap.data();
    const requester = req.auth.uid;
    const requesterRole = (await admin.firestore().collection('users').doc(requester).get()).data()?.role;
    if (requesterRole !== 'admin' && lost.reportedBy !== requester) {
      return { ok: false, error: 'Not allowed to run matches for this item' };
    }

    const foundDocs = await admin.firestore().collection('lost_items').where('status', '==', 'found').get();
    const foundItems = foundDocs.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (!foundItems.length) return { ok: true, matches: [] };

    if (!process.env.GEMINI_API_KEY) {
      const lostWords = new Set(String(`${lost.description || ''} ${lost.location || ''}`).toLowerCase().split(/\W+/).filter(Boolean));
      const matches = foundItems
        .map((item) => {
          const words = String(`${item.description || ''} ${item.location || ''}`).toLowerCase().split(/\W+/).filter(Boolean);
          const overlap = words.filter((word) => lostWords.has(word)).length;
          return { id: item.id, score: overlap / Math.max(1, lostWords.size), description: item.description, location: item.location };
        })
        .filter((match) => match.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((match) => ({ ...match, score: Number(match.score.toFixed(3)) }));
      await admin.firestore().collection('lost_items').doc(itemId).set({ suggestedMatches: matches }, { merge: true });
      return { ok: true, matches };
    }

    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = ai.getGenerativeModel({ model: 'text-embedding-004' });

    const lostText = `${lost.description || ''} ${lost.location || ''}`;
    const lostEmbed = (await model.embedContent(lostText)).embedding.values || [];

    const scored = [];
    for (const item of foundItems) {
      const foundText = `${item.description || ''} ${item.location || ''}`;
      const foundEmbed = (await model.embedContent(foundText)).embedding.values || [];
      scored.push({ id: item.id, score: cosine(lostEmbed, foundEmbed), item });
    }

    const matches = scored
      .filter((m) => m.score >= 0.7)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((m) => ({ id: m.id, score: Number(m.score.toFixed(3)), description: m.item.description, location: m.item.location }));

    await admin.firestore().collection('lost_items').doc(itemId).set({ suggestedMatches: matches }, { merge: true });

    if (lost.reportedBy) {
      const user = await admin.firestore().collection('users').doc(lost.reportedBy).get();
      const token = user.data()?.fcmToken;
      if (token && matches.length) {
        await admin.messaging().send({
          token,
          notification: {
            title: 'SmartVenueX Lost & Found Match',
            body: `We found ${matches.length} possible match(es) for your report.`
          }
        });
      }
    }

    return { ok: true, matches };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
