import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../../components/common/PageTransition';
import Skeleton from '../../components/ui/skeleton';
import { useAuth } from '../../hooks/useAuth';
import { bookSlot, getLiveEvent, getSlots } from '../../services/event.service';

function slotTone(ratio) {
  if (ratio > 0.9) return 'border-purple-300 bg-purple-500/25 text-purple-100';
  if (ratio > 0.7) return 'border-danger bg-danger/20 text-red-100';
  if (ratio > 0.4) return 'border-warning bg-warning/20 text-yellow-50';
  return 'border-success bg-success/20 text-green-50';
}

export default function ArrivalSlotPage() {
  const { profile, refresh } = useAuth();
  const [event, setEvent] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const live = await getLiveEvent();
      setEvent(live);
      setSlots(live ? await getSlots(live.id) : []);
      setLoading(false);
    })().catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  }, []);

  const choose = async (slot) => {
    setSelected(slot.id);
    setError('');
    try {
      await bookSlot(slot.id, event?.id || 'demoEvent', slot.seatZone || profile?.seatZone || 'A');
      localStorage.setItem('smartvenuex-slot-id', slot.id);
      await refresh();
      navigate('/ticket');
    } catch (err) {
      setError(err.message || 'Unable to book slot');
    } finally {
      setSelected('');
    }
  };

  return (
    <PageTransition className='space-y-4 p-4' role='main' aria-label='Arrival slot page'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>Choose Arrival Slot</h1>
        <p className='text-sm text-white/70'>{event?.name || 'Live event'} entry windows are color coded by capacity.</p>
      </div>

      {loading ? (
        <div className='space-y-3'>
          <Skeleton className='h-20 w-full' />
          <Skeleton className='h-20 w-full' />
          <Skeleton className='h-20 w-full' />
        </div>
      ) : null}

      {!loading && slots.length === 0 ? <p className='rounded-md bg-white/10 p-3'>No arrival slots are available right now.</p> : null}

      <div className='space-y-3'>
        {slots.map((slot) => {
          const ratio = Number(slot.booked || 0) / Number(slot.capacity || 1);
          const percent = Math.round(ratio * 100);
          return (
            <button
              key={slot.id}
              disabled={selected === slot.id || ratio >= 1}
              onClick={() => choose(slot)}
              className={`w-full rounded-lg border p-4 text-left transition disabled:opacity-60 ${slotTone(ratio)}`}
            >
              <span className='flex items-center justify-between gap-3'>
                <span>
                  <span className='block font-bold'>{slot.gateAssigned}</span>
                  <span className='text-sm opacity-80'>Zone {slot.seatZone || profile?.seatZone || 'A'} entry window</span>
                </span>
                <span className='rounded-full bg-black/25 px-3 py-1 text-sm'>{percent}% full</span>
              </span>
              <span className='mt-3 block h-2 overflow-hidden rounded-full bg-black/20'>
                <span className='block h-full bg-white' style={{ width: `${Math.min(100, percent)}%` }} />
              </span>
            </button>
          );
        })}
      </div>

      {error ? <p className='rounded-md bg-danger/15 p-3 text-sm text-red-100'>{error}</p> : null}
    </PageTransition>
  );
}
