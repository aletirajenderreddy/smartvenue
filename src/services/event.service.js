import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { bookArrivalSlot } from './ticket.service';

export async function getLiveEvent() {
  const q = query(collection(db, 'events'), where('status', 'in', ['upcoming', 'live']), limit(1));
  const snap = await getDocs(q);
  return snap.docs[0] ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null;
}

export async function getSlots(eventId) {
  const q = query(collection(db, 'slots'), where('eventId', '==', eventId), orderBy('startTime', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function bookSlot(slotId, eventId = 'demoEvent', seatZone = 'A') {
  return bookArrivalSlot({ slotId, eventId, seatZone });
}
