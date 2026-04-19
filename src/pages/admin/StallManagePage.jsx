import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import PageTransition from '../../components/common/PageTransition';
import { db } from '../../config/firebase';
import { updateStall } from '../../services/admin.service';

export default function StallManagePage() {
  const [stalls, setStalls] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => onSnapshot(collection(db, 'stalls'), (snap) => setStalls(snap.docs.map((d) => ({ id: d.id, ...d.data() })))), []);

  const update = async (payload) => {
    try {
      await updateStall(payload);
      setMessage('Stall updated.');
    } catch (err) {
      setMessage(err.message || 'Unable to update stall');
    }
  };

  return (
    <PageTransition className='space-y-4 p-6' role='main' aria-label='Stall management page'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>Stall Management</h1>
        <p className='text-sm text-white/70'>Keep open status and wait times live for attendee ordering.</p>
      </div>
      <section className='grid gap-3 md:grid-cols-2'>
        {stalls.map((stall) => (
          <div key={stall.id} className='rounded-lg border border-white/10 bg-white/[0.06] p-4'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <h2 className='font-heading text-lg font-bold'>{stall.name}</h2>
                <p className='text-sm text-white/70'>Zone {stall.zone} / {stall.category}</p>
              </div>
              <label className='flex items-center gap-2 text-sm font-bold'>
                Open
                <input
                  type='checkbox'
                  checked={Boolean(stall.isOpen)}
                  onChange={(e) => update({ stallId: stall.id, isOpen: e.target.checked })}
                />
              </label>
            </div>
            <label className='mt-4 block text-sm font-bold'>
              Wait minutes
              <input
                className='mt-2 w-full rounded-md bg-white/10 p-3'
                type='number'
                min='0'
                max='240'
                defaultValue={stall.waitMinutes || 0}
                onBlur={(e) => update({ stallId: stall.id, waitMinutes: Number(e.target.value) })}
              />
            </label>
          </div>
        ))}
      </section>
      {message ? <p className='rounded-md bg-white/10 p-3 text-sm'>{message}</p> : null}
    </PageTransition>
  );
}
