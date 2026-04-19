import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from '../config/firebase';
import { geminiModel } from '../config/gemini';

const fn = getFunctions(app, 'us-central1');

function heuristicMatches(lostItem, foundItems) {
  const lostWords = new Set(String(`${lostItem.description || ''} ${lostItem.location || ''}`).toLowerCase().split(/\W+/).filter(Boolean));
  return foundItems
    .map((item) => {
      const foundWords = String(`${item.description || ''} ${item.location || ''}`).toLowerCase().split(/\W+/).filter(Boolean);
      const overlap = foundWords.filter((word) => lostWords.has(word)).length;
      return { id: item.id, score: overlap / Math.max(1, lostWords.size), description: item.description, location: item.location };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => ({ ...item, score: Number(item.score.toFixed(3)) }));
}

export async function askGemini(message) {
  try {
    const response = (await httpsCallable(fn, 'anomalyDetect')({ message })).data;
    if (!response?.ok) throw new Error(response?.error || 'Gemini request failed');
    return response;
  } catch (_error) {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      return { ok: true, reply: 'Live AI is not deployed yet. Please check the nearest help desk or venue dashboard.', sentiment: 'neutral' };
    }
    const result = await geminiModel.generateContent(
      `You are SmartVenueX assistant. Answer briefly and practically for a live sports venue attendee. User question: ${message}`
    );
    return { ok: true, reply: result.response.text(), sentiment: 'neutral' };
  }
}

export async function suggestLostFoundMatches(itemId) {
  try {
    const response = (await httpsCallable(fn, 'suggestLostFoundMatches')({ itemId })).data;
    if (!response?.ok) throw new Error(response?.error || 'Lost & found match request failed');
    return response;
  } catch (_error) {
    const [lostSnap, foundSnap] = await Promise.all([getDoc(doc(db, 'lost_items', itemId)), getDocs(query(collection(db, 'lost_items'), where('status', '==', 'found')))]);
    const lostItem = lostSnap.exists() ? { id: lostSnap.id, ...lostSnap.data() } : null;
    const foundItems = foundSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { ok: true, matches: lostItem ? heuristicMatches(lostItem, foundItems) : [] };
  }
}
