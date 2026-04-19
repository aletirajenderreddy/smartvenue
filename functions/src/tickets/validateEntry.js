import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import { FirebaseFunctionsRateLimiter } from 'firebase-functions-rate-limiter';
import { densityLevel, requireRole, requireString, toMillis } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

const limiter = FirebaseFunctionsRateLimiter.withRealtimeDbBackend({
  name: 'qrLimiter',
  maxCalls: 10,
  periodSeconds: 60,
  db: admin.database()
});

export const validateEntry = onCall(async (req) => {
  try {
    const { uid: scannerUid } = await requireRole(req, ['admin', 'gate_staff']);
    await limiter.rejectOnQuotaExceededOrRecordUsage(req);

    const token = requireString(req.data?.token, 'token', { min: 10, max: 5000 });
    const zoneId = requireString(req.data?.zoneId || 'zone-a', 'zoneId', { min: 2, max: 100 });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    if (!payload.userId || !payload.eventId || !payload.slotId) throw new Error('QR payload is incomplete');

    const tid = `${payload.userId}_${payload.eventId}`;
    const ticketRef = admin.firestore().collection('tickets').doc(tid);
    const zoneRef = admin.firestore().collection('zones').doc(zoneId);
    await admin.firestore().runTransaction(async (tx) => {
      const slotRef = admin.firestore().collection('slots').doc(payload.slotId);
      const [ticketSnap, zoneSnap, slotSnap] = await Promise.all([tx.get(ticketRef), tx.get(zoneRef), tx.get(slotRef)]);
      if (!ticketSnap.exists) throw new Error('Ticket not found');
      const ticket = ticketSnap.data();
      if (!ticket?.isValid) throw new Error('Invalid ticket');
      if (ticket.entryTime) throw new Error('Ticket already used for entry');
      if (ticket.userId !== payload.userId || ticket.eventId !== payload.eventId) throw new Error('Ticket payload mismatch');
      if (ticket.slotId && ticket.slotId !== payload.slotId) throw new Error('Ticket slot mismatch');

      if (slotSnap.exists) {
        const slot = slotSnap.data();
        const now = Date.now();
        const startMs = toMillis(slot.startTime);
        const endMs = toMillis(slot.endTime);
        const earlyBufferMs = 30 * 60 * 1000;
        const lateBufferMs = 30 * 60 * 1000;
        if (startMs && now < startMs - earlyBufferMs) throw new Error('Arrival slot has not opened yet');
        if (endMs && now > endMs + lateBufferMs) throw new Error('Arrival slot has expired');
      }

      if (!zoneSnap.exists) throw new Error('Zone does not exist');
      const zone = zoneSnap.data();
      const current = zone.currentCount || 0;
      const capacity = zone.capacity || 0;
      if (capacity > 0 && current >= capacity) throw new Error('Zone is at capacity');

      tx.update(ticketRef, {
        entryTime: admin.firestore.FieldValue.serverTimestamp(),
        entryGate: req.data?.gateId || null,
        zoneId,
        scanInBy: scannerUid
      });
      tx.update(zoneRef, {
        currentCount: current + 1,
        densityLevel: densityLevel(current + 1, capacity || 1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      tx.set(admin.firestore().collection('scan_logs').doc(), {
        type: 'entry',
        ticketId: tid,
        userId: payload.userId,
        eventId: payload.eventId,
        slotId: payload.slotId,
        zoneId,
        scannerUid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await admin.database().ref(`crowd/live/${zoneId}/lastScanAt`).set(Date.now());
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: error.message };
  }
});
