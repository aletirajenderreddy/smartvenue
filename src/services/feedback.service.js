import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, app, db } from '../config/firebase';
import { askGemini } from './gemini.service';

const fn = getFunctions(app, 'us-central1');

export async function submitFeedback(payload) {
  try {
    const response = (await httpsCallable(fn, 'submitFeedback')(payload)).data;
    if (!response?.ok) throw new Error(response?.error || 'Unable to submit feedback');
    return response;
  } catch (_error) {
    const ai = await askGemini(`Classify this event feedback as positive, neutral, or negative: ${payload.comment || ''}`);
    const sentiment = /negative/i.test(ai.reply) ? 'negative' : /positive/i.test(ai.reply) ? 'positive' : 'neutral';
    const ref = await addDoc(collection(db, 'feedback'), {
      userId: auth.currentUser?.uid || null,
      eventId: payload.eventId || 'demoEvent',
      rating: payload.rating,
      crowdRating: payload.crowdRating,
      foodRating: payload.foodRating,
      safetyRating: payload.safetyRating,
      comment: payload.comment || '',
      sentiment,
      createdAt: serverTimestamp()
    });
    return { ok: true, feedbackId: ref.id, sentiment };
  }
}
