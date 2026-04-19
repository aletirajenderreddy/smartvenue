import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { optionalString, requireAuth, requireNumber, requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

function fallbackSentiment(comment) {
  const text = String(comment || '').toLowerCase();
  if (/(bad|poor|slow|unsafe|crowded|angry|terrible|hate)/.test(text)) return 'negative';
  if (/(good|great|safe|fast|love|excellent|smooth|helpful)/.test(text)) return 'positive';
  return 'neutral';
}

export const submitFeedback = onCall(async (req) => {
  try {
    const uid = requireAuth(req);
    const eventId = requireString(req.data?.eventId || 'demoEvent', 'eventId', { min: 3, max: 100 });
    const rating = requireNumber(req.data?.rating, 'rating', { min: 1, max: 5 });
    const crowdRating = requireNumber(req.data?.crowdRating, 'crowdRating', { min: 1, max: 5 });
    const foodRating = requireNumber(req.data?.foodRating, 'foodRating', { min: 1, max: 5 });
    const safetyRating = requireNumber(req.data?.safetyRating || rating, 'safetyRating', { min: 1, max: 5 });
    const comment = optionalString(req.data?.comment, 'comment', { max: 1000, fallback: '' });

    let sentiment = fallbackSentiment(comment);
    if (process.env.GEMINI_API_KEY && comment) {
      try {
        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const out = await model.generateContent(
          `Classify this event feedback as exactly one of positive, neutral, negative. Feedback: ${comment}`
        );
        const text = out.response.text().toLowerCase();
        sentiment = /negative/.test(text) ? 'negative' : /positive/.test(text) ? 'positive' : 'neutral';
      } catch {
        sentiment = fallbackSentiment(comment);
      }
    }

    const feedbackRef = await admin.firestore().collection('feedback').add({
      userId: uid,
      eventId,
      rating,
      crowdRating,
      foodRating,
      safetyRating,
      comment,
      sentiment,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { ok: true, feedbackId: feedbackRef.id, sentiment };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
