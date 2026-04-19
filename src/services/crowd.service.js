import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export const subscribeZones = (cb) =>
  onSnapshot(collection(db, 'zones'), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
