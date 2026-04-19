import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';
import { suggestLostFoundMatches } from './gemini.service';

export async function reportLostItem({ description, location, contactInfo, photoFile, status = 'lost' }) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in required');
  let photo = '';
  if (photoFile) {
    try {
      const photoRef = ref(storage, `lost-items/${uid}/${Date.now()}-${photoFile.name}`);
      await uploadBytes(photoRef, photoFile, { contentType: photoFile.type || 'image/jpeg' });
      photo = await getDownloadURL(photoRef);
    } catch (_error) {
      photo = '';
    }
  }
  const docRef = await addDoc(collection(db, 'lost_items'), {
    description,
    location,
    photo,
    contactInfo,
    status,
    reportedBy: uid,
    createdAt: serverTimestamp()
  });
  const result = status === 'lost' ? await suggestLostFoundMatches(docRef.id).catch(() => ({ matches: [] })) : { matches: [] };
  return { id: docRef.id, matches: result.matches || [] };
}

export async function browseFoundItems() {
  const snap = await getDocs(query(collection(db, 'lost_items'), where('status', '==', 'found')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
