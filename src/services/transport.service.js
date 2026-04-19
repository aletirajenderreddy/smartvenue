import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, auth, db } from '../config/firebase';

export const subscribeBuses = (cb) =>
  onSnapshot(collection(db, 'buses'), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))));

const fn = getFunctions(app, 'us-central1');

export async function manageBusSubscription(busId, action) {
  try {
    const response = (await httpsCallable(fn, 'manageBusSubscription')({ busId, action })).data;
    if (!response?.ok) throw new Error(response?.error || 'Unable to update bus subscription');
    return response;
  } catch (_error) {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Sign in required');
    const current = JSON.parse(localStorage.getItem('smartvenuex-bus-subscriptions') || '[]');
    const next =
      action === 'subscribe' ? Array.from(new Set([...current, busId])) : current.filter((id) => id !== busId);
    localStorage.setItem('smartvenuex-bus-subscriptions', JSON.stringify(next));
    await setDoc(doc(db, 'users', uid), { busSubscriptions: next }, { merge: true });
    return { ok: true, busSubscriptions: next };
  }
}

export async function sendBusEtaUpdate(payload) {
  const response = (await httpsCallable(fn, 'sendBusEta')(payload)).data;
  if (!response?.ok) throw new Error(response?.error || 'Unable to send bus ETA update');
  return response;
}
