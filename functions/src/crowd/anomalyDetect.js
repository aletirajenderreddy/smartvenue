import { onCall } from 'firebase-functions/v2/https';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';
import { requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

export const anomalyDetect = onCall(async (req) => {
  try {
    if (!req.auth?.uid) return { ok: false, error: 'Authentication required' };

    const message = requireString(req.data?.message, 'message', { min: 2, max: 500 });
    const [eventsSnap, zonesSnap, stallsSnap, busesSnap] = await Promise.all([
      admin.firestore().collection('events').where('status', 'in', ['upcoming', 'live']).limit(1).get(),
      admin.firestore().collection('zones').get(),
      admin.firestore().collection('stalls').where('isOpen', '==', true).get(),
      admin.firestore().collection('buses').get()
    ]);
    const event = eventsSnap.docs[0]?.data() || {};
    const zones = zonesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const stalls = stallsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const buses = busesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const quietZone = [...zones].sort((a, b) => (a.currentCount || 0) / (a.capacity || 1) - (b.currentCount || 0) / (b.capacity || 1))[0];
    const fastestStall = [...stalls].sort((a, b) => (a.waitMinutes || 0) - (b.waitMinutes || 0))[0];
    const fallback = `Best live recommendation: use ${quietZone?.name || 'the lowest-density open corridor'} and try ${
      fastestStall?.name || 'the nearest open stall'
    } for food. Current venue status: ${event.status || 'live demo'}.`;

    if (!process.env.GEMINI_API_KEY) {
      return { ok: true, reply: fallback, sentiment: 'neutral' };
    }

    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are SmartVenueX assistant. Give a concise, actionable answer.
Event: ${JSON.stringify(event)}
Zones: ${JSON.stringify(zones)}
Open stalls: ${JSON.stringify(stalls)}
Buses: ${JSON.stringify(buses)}
User question: ${message}`;
    const out = await model.generateContent(prompt);
    const txt = out.response.text();
    const sentiment = /negative/i.test(txt) ? 'negative' : /positive/i.test(txt) ? 'positive' : 'neutral';
    return { ok: true, reply: txt || fallback, sentiment };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
