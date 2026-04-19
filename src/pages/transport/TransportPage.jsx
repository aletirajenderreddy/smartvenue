import { useEffect, useState } from 'react';
import PageTransition from '../../components/common/PageTransition';
import VenueMap from '../../components/maps/VenueMap';
import { manageBusSubscription, subscribeBuses } from '../../services/transport.service';

function busTone(bus) {
  const delay = Number(bus.delayMinutes ?? bus.eta ?? 0);
  if (delay > 10) return 'bg-danger/20 border-danger text-red-100';
  if (delay > 5) return 'bg-warning/20 border-warning text-yellow-50';
  return 'bg-success/15 border-success text-green-50';
}

export default function TransportPage() {
  const [buses, setBuses] = useState([]);
  const [subscribedBus, setSubscribedBus] = useState(localStorage.getItem('subscribedBus') || '');
  const [pickup, setPickup] = useState(localStorage.getItem('pickupPoint') || 'North Terminal');
  const [error, setError] = useState('');

  useEffect(() => subscribeBuses(setBuses), []);

  const toggleSubscription = async (busId) => {
    setError('');
    try {
      const action = subscribedBus === busId ? 'unsubscribe' : 'subscribe';
      await manageBusSubscription(busId, action);
      const next = action === 'subscribe' ? busId : '';
      setSubscribedBus(next);
      localStorage.setItem('subscribedBus', next);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <PageTransition className='space-y-4 p-4' role='main' aria-label='Transport tracker page'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>Transport Tracker</h1>
        <p className='text-sm text-white/70'>Live buses update every 30 seconds from Firestore.</p>
      </div>
      <label className='block text-sm font-bold'>
        Pickup point
        <select
          className='mt-2 w-full rounded-md border border-white/10 bg-white/10 p-3'
          value={pickup}
          onChange={(e) => {
            setPickup(e.target.value);
            localStorage.setItem('pickupPoint', e.target.value);
          }}
        >
          {['North Terminal', 'East Metro', 'Parking P3', 'South Gate'].map((point) => (
            <option key={point}>{point}</option>
          ))}
        </select>
      </label>
      <VenueMap markers={buses} className='h-80 rounded-lg' />
      {buses.map((bus) => (
        <section key={bus.id} className={`rounded-lg border p-4 ${busTone(bus)}`}>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <h2 className='font-heading text-lg font-bold'>{bus.route}</h2>
              <p className='text-sm opacity-85'>
                ETA {bus.eta} min / departs {bus.departureTime || 'soon'} / capacity {bus.capacity}
              </p>
            </div>
            <button className='rounded-md bg-primary px-3 py-2 text-sm font-bold text-white' onClick={() => toggleSubscription(bus.id)}>
              {subscribedBus === bus.id ? 'Unsubscribe' : 'Subscribe'}
            </button>
          </div>
        </section>
      ))}
      {error ? <p className='rounded-md bg-danger/15 p-3 text-sm text-red-100'>{error}</p> : null}
    </PageTransition>
  );
}
