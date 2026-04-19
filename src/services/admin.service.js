import { collection, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from '../config/firebase';

const fn = getFunctions(app, 'us-central1');

async function call(name, payload) {
  const response = (await httpsCallable(fn, name)(payload)).data;
  if (!response?.ok) throw new Error(response?.error || `${name} failed`);
  return response;
}

export async function updateZoneControl(payload) {
  try {
    return await call('updateZoneControl', payload);
  } catch (_error) {
    const patch = {};
    if (payload.currentCount != null) patch.currentCount = payload.currentCount;
    if (payload.capacity != null) patch.capacity = payload.capacity;
    if (payload.isClosed != null) patch.isClosed = payload.isClosed;
    await updateDoc(doc(db, 'zones', payload.zoneId), patch);
    return { ok: true };
  }
}

export async function updateStall(payload) {
  try {
    return await call('updateStall', payload);
  } catch (_error) {
    const patch = {};
    if (payload.isOpen != null) patch.isOpen = payload.isOpen;
    if (payload.waitMinutes != null) patch.waitMinutes = payload.waitMinutes;
    if (payload.name != null) patch.name = payload.name;
    if (payload.category != null) patch.category = payload.category;
    await updateDoc(doc(db, 'stalls', payload.stallId), patch);
    return { ok: true };
  }
}

export const sendExitWave = (payload) => call('sendExitWave', payload);

export async function exportReport(payload) {
  try {
    return await call('exportReport', payload);
  } catch (_error) {
    const eventId = payload?.eventId || 'demoEvent';
    const snap = await getDocs(query(collection(db, 'feedback'), where('eventId', '==', eventId)));
    const rows = ['userId,eventId,rating,crowdRating,foodRating,safetyRating,sentiment'];
    snap.docs.forEach((docSnap) => {
      const row = docSnap.data();
      rows.push(
        [row.userId, row.eventId, row.rating, row.crowdRating, row.foodRating, row.safetyRating, row.sentiment].join(',')
      );
    });
    return { ok: true, csv: rows.join('\n') };
  }
}
