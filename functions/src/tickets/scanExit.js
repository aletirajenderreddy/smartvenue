import { onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import { FirebaseFunctionsRateLimiter } from 'firebase-functions-rate-limiter';
import { densityLevel, requireRole, requireString } from '../utils/security.js';

if (!admin.apps.length) admin.initializeApp();

const limiter = FirebaseFunctionsRateLimiter.withRealtimeDbBackend({
  name: 'exitScanLimiter',
  maxCalls: 15,
  periodSeconds: 60,
  db: admin.database()
});

export const scanExit = onCall(async (req) => {
  try {
    const { uid: scannerUid } = await requireRole(req, ['admin', 'gate_staff']);
    await limiter.rejectOnQuotaExceededOrRecordUsage(req);

    const token = requireString(req.data?.token, 'token', { min: 10, max: 5000 });
    const zoneId = requireString(req.data?.zoneId || 'zone-a', 'zoneId', { min: 2, max: 100 });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const ticketId = `${payload.userId}_${payload.eventId}`;

    const db = admin.firestore();
    const ticketRef = db.collection('tickets').doc(ticketId);
    const zoneRef = db.collection('zones').doc(zoneId);

    await db.runTransaction(async (tx) => {
      const [ticketSnap, zoneSnap] = await Promise.all([tx.get(ticketRef), tx.get(zoneRef)]);
      if (!ticketSnap.exists) throw new Error('Ticket not found');
      const ticket = ticketSnap.data();
      if (!ticket.entryTime) throw new Error('Ticket has not scanned in');
      if (ticket.exitTime) throw new Error('Ticket already scanned out');
      if (!zoneSnap.exists) throw new Error('Zone does not exist');
      const zone = zoneSnap.data();
      const nextCount = Math.max(0, Number(zone.currentCount || 0) - 1);

      tx.update(ticketRef, {
        exitTime: admin.firestore.FieldValue.serverTimestamp(),
        exitGate: req.data?.gateId || null,
        scanOutBy: scannerUid,
        feedbackRequired: true
      });
      tx.update(zoneRef, {
        currentCount: nextCount,
        densityLevel: densityLevel(nextCount, zone.capacity || 1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      tx.set(db.collection('scan_logs').doc(), {
        type: 'exit',
        ticketId,
        userId: payload.userId,
        eventId: payload.eventId,
        zoneId,
        scannerUid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return { ok: true, valid: true, ticketId };
  } catch (error) {
    return { ok: false, valid: false, error: error.message };
  }
});
