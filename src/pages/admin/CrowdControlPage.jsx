import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import PageTransition from '../../components/common/PageTransition';
import { db } from '../../config/firebase';
import { updateZoneControl } from '../../services/admin.service';

export default function CrowdControlPage() {
  const [zones, setZones] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => onSnapshot(collection(db, 'zones'), (snap) => setZones(snap.docs.map((d) => ({ id: d.id, ...d.data() })))), []);

  const update = async (payload) => {
    try {
      await updateZoneControl(payload);
      setMessage('Zone control updated.');
    } catch (err) {
      setMessage(err.message || 'Unable to update zone');
    }
  };

  return (
    <PageTransition className='space-y-4 p-6' role='main' aria-label='Crowd control page'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>Crowd Control</h1>
        <p className='text-sm text-white/70'>Tune live counts, close zones, and trigger redirection pushes.</p>
      </div>
      <section className='grid gap-3 md:grid-cols-2'>
        {zones.map((zone) => (
          <div key={zone.id} className='rounded-lg border border-white/10 bg-white/[0.06] p-4'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <h2 className='font-heading text-lg font-bold'>{zone.name}</h2>
                <p className='text-sm text-white/70'>
                  {zone.currentCount || 0} / {zone.capacity || 0} ({zone.densityLevel || 'low'})
                </p>
              </div>
              <button className='rounded-md bg-danger px-3 py-2 text-sm font-bold' onClick={() => update({ zoneId: zone.id, isClosed: true })}>
                Close
              </button>
            </div>
            <label className='mt-4 block text-sm font-bold'>
              Current count
              <input
                type='range'
                min='0'
                max={zone.capacity || 1}
                value={zone.currentCount || 0}
                onChange={(e) => update({ zoneId: zone.id, currentCount: Number(e.target.value) })}
                className='mt-2 w-full'
              />
            </label>
          </div>
        ))}
      </section>
      {message ? <p className='rounded-md bg-white/10 p-3 text-sm'>{message}</p> : null}
    </PageTransition>
  );
}
