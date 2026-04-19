import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from '../config/firebase';

const fn = getFunctions(app, 'us-central1');

async function call(name, payload) {
  const response = (await httpsCallable(fn, name)(payload)).data;
  if (!response?.ok) throw new Error(response?.error || `${name} failed`);
  return response;
}

export const recordTriviaScore = (payload) => call('recordTriviaScore', payload);
export const collectStamp = (payload) => call('collectStamp', payload);

export const subscribeLeaderboard = (cb) => {
  const q = query(collection(db, 'users'), orderBy('loyaltyPoints', 'desc'), limit(10));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
};
