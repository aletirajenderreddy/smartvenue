import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from '../config/firebase';

const fn = getFunctions(app, 'us-central1');

function callable(name) {
  return httpsCallable(fn, name);
}

export const subscribeStalls = (cb) =>
  onSnapshot(collection(db, 'stalls'), (snap) => {
    const stalls = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => Number(a.waitMinutes || 0) - Number(b.waitMinutes || 0));
    cb(stalls);
  });

export const subscribeUserOrders = (uid, cb) => {
  if (!uid) return () => {};
  const q = query(collection(db, 'orders'), where('userId', '==', uid));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
};

export const createPaymentOrder = (total) =>
  callable('createPaymentOrder')({ total }).then((r) => {
    if (!r.data?.ok) throw new Error(r.data?.error || 'Unable to create payment order');
    return r.data;
  });

export async function createOrder(order) {
  const ref = await addDoc(collection(db, 'orders'), {
    userId: order.userId,
    stallId: order.stallId,
    items: order.items,
    total: order.total,
    status: 'pending',
    paymentId: order.paymentId,
    razorpayOrderId: order.razorpayOrderId,
    createdAt: serverTimestamp()
  });
  const response = await callable('processOrder')({
    orderId: ref.id,
    total: order.total,
    paymentId: order.paymentId,
    razorpayOrderId: order.razorpayOrderId,
    razorpaySignature: order.razorpaySignature
  });
  if (!response.data?.ok) throw new Error(response.data?.error || 'Payment verification failed');
  return ref.id;
}

export const subscribeOrder = (id, cb) => onSnapshot(doc(db, 'orders', id), (snap) => cb({ id: snap.id, ...snap.data() }));

export async function markOrderCollected(payload) {
  const response = (await callable('markOrderCollected')(payload)).data;
  if (!response?.ok) throw new Error(response?.error || 'Unable to update order');
  return response;
}
