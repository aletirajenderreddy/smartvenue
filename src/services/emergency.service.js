import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, auth, db } from '../config/firebase';

const fn = getFunctions(app, 'us-central1');

async function call(name, payload) {
  const response = (await httpsCallable(fn, name)(payload)).data;
  if (!response?.ok) throw new Error(response?.error || `${name} failed`);
  return response;
}

export async function sendSOS(payload) {
  try {
    return await call('createSosAlert', payload);
  } catch (_error) {
    const ref = await addDoc(collection(db, 'sos_alerts'), {
      ...payload,
      userId: auth.currentUser?.uid || null,
      status: 'open',
      responderId: null,
      createdAt: serverTimestamp()
    });
    return { ok: true, alertId: ref.id, responderId: null };
  }
}

export const broadcastEmergency = (payload) => call('sendEmergency', payload);

export async function assignResponder(payload) {
  try {
    return await call('assignResponder', payload);
  } catch (_error) {
    await setDoc(
      doc(db, 'sos_alerts', payload.alertId),
      {
        responderId: payload.responderId,
        status: payload.status || 'assigned',
        assignedAt: serverTimestamp()
      },
      { merge: true }
    );
    return { ok: true };
  }
}
