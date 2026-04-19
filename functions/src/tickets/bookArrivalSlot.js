import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { densityLevel, requireAuth, requireString, toMillis } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

export const bookArrivalSlot = onCall(async (req) => {
  try {
    const uid = requireAuth(req);
    const slotId = requireString(req.data?.slotId, 'slotId', { min: 1, max: 100 });
    const eventId = requireString(req.data?.eventId || 'demoEvent', 'eventId', { min: 3, max: 100 });
    const seatZone = requireString(req.data?.seatZone || 'A', 'seatZone', { min: 1, max: 40 });

    const db = admin.firestore();
    const slotRef = db.collection('slots').doc(slotId);
    const ticketRef = db.collection('tickets').doc(`${uid}_${eventId}`);
    const userRef = db.collection('users').doc(uid);

    const result = await db.runTransaction(async (tx) => {
      const [slotSnap, userSnap] = await Promise.all([tx.get(slotRef), tx.get(userRef)]);
      if (!slotSnap.exists) throw new Error('Arrival slot not found');
      const slot = slotSnap.data();
      if (slot.eventId !== eventId) throw new Error('Slot does not belong to this event');

      const booked = Number(slot.booked || 0);
      const capacity = Number(slot.capacity || 0);
      if (capacity <= 0) throw new Error('Slot capacity is not configured');
      if (booked >= capacity) throw new Error('Arrival slot is full');

      const now = Date.now();
      const endMs = toMillis(slot.endTime);
      if (endMs && now > endMs) throw new Error('Arrival slot has already ended');

      tx.update(slotRef, {
        booked: booked + 1,
        densityLevel: densityLevel(booked + 1, capacity),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const user = userSnap.exists ? userSnap.data() : {};
      tx.set(
        userRef,
        {
          slotId,
          seatZone,
          role: user.role || 'attendee',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      tx.set(
        ticketRef,
        {
          userId: uid,
          eventId,
          seatZone,
          slotId,
          slotTime: slot.startTime || slotId,
          gateAssigned: slot.gateAssigned || 'Gate 1',
          entryTime: null,
          exitTime: null,
          isValid: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      return {
        ticketId: ticketRef.id,
        booked: booked + 1,
        capacity,
        gateAssigned: slot.gateAssigned || 'Gate 1'
      };
    });

    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
