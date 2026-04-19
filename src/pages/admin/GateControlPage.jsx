import { useState } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../../components/common/PageTransition';
import QRScanner from '../../components/qr/QRScanner';
import { markOrderCollected } from '../../services/food.service';
import { scanExit, validateEntry } from '../../services/ticket.service';

function readJwtPayload(token) {
  try {
    const body = token.split('.')[1];
    return JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
  } catch (_error) {
    return {};
  }
}

export default function GateControlPage() {
  const [status, setStatus] = useState('Waiting for scan...');
  const [phase, setPhase] = useState('idle');
  const [mode, setMode] = useState('entry');
  const [zoneId, setZoneId] = useState('zone-a');

  const handleScan = async (token) => {
    if (mode === 'entry') {
      const result = await validateEntry({ token, zoneId, gateId: 'Gate Control' });
      setStatus(result.valid ? `Entry valid for ${result.payload?.userId || 'attendee'}` : 'Entry denied');
      setPhase(result.valid ? 'success' : 'error');
      return;
    }
    if (mode === 'exit') {
      const result = await scanExit({ token, zoneId, gateId: 'Gate Control' });
      setStatus(result.valid ? 'Exit recorded' : 'Exit denied');
      setPhase(result.valid ? 'success' : 'error');
      return;
    }
    const payload = readJwtPayload(token);
    await markOrderCollected({ token, orderId: payload.orderId, status: 'collected' });
    setStatus(`Order ${payload.orderId || ''} collected`);
    setPhase('success');
  };

  return (
    <PageTransition className='space-y-4 p-4 md:p-6' role='main' aria-label='Gate control page'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='font-heading text-2xl font-bold'>Gate & Collection Scanner</h1>
          <p className='text-sm text-white/70'>Rate limited QR validation for entry, exit, and food collection.</p>
        </div>
        <select className='rounded-md bg-white/10 p-3' value={zoneId} onChange={(e) => setZoneId(e.target.value)} aria-label='Scan zone'>
          {['zone-a', 'zone-b', 'zone-c', 'zone-d'].map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </div>
      <div className='grid grid-cols-3 gap-2 rounded-md bg-white/10 p-1' role='tablist'>
        {['entry', 'exit', 'food'].map((value) => (
          <button
            key={value}
            role='tab'
            aria-selected={mode === value}
            className={`rounded px-3 py-2 text-sm font-bold capitalize ${mode === value ? 'bg-primary' : ''}`}
            onClick={() => setMode(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <motion.div
        key={phase}
        initial={{ opacity: 0.5, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg p-4 text-sm ${
          phase === 'success'
            ? 'bg-success/25'
            : phase === 'error'
              ? 'bg-danger/25'
              : phase === 'duplicate'
                ? 'bg-warning/25 text-black'
                : 'bg-white/10'
        }`}
      >
        {phase === 'processing' ? 'Processing QR...' : phase === 'duplicate' ? 'Duplicate scan blocked (cooldown)' : status}
      </motion.div>
      <section className='rounded-lg border border-white/10 bg-white/[0.06] p-3'>
        <QRScanner
          onStateChange={(nextPhase) => setPhase(nextPhase)}
          onScan={async (token) => {
            try {
              await handleScan(token);
            } catch (error) {
              setStatus(`Scan denied: ${error.message}`);
              setPhase('error');
            }
          }}
        />
      </section>
    </PageTransition>
  );
}
