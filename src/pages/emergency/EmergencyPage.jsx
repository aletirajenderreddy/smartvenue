import { useEffect, useState } from 'react';
import { Flame, HeartPulse, Search, Siren } from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';
import VenueMap from '../../components/maps/VenueMap';
import useGeolocation from '../../hooks/useGeolocation';
import { sendSOS } from '../../services/emergency.service';
import { getLiveEvent } from '../../services/event.service';

const actions = [
  { type: 'SOS', label: 'SOS', icon: Siren, tone: 'bg-danger' },
  { type: 'Medical Emergency', label: 'Medical', icon: HeartPulse, tone: 'bg-primary' },
  { type: 'Fire', label: 'Fire', icon: Flame, tone: 'bg-warning text-black' },
  { type: 'Missing Person', label: 'Missing Person', icon: Search, tone: 'bg-white/15' }
];

export default function EmergencyPage() {
  const location = useGeolocation();
  const [event, setEvent] = useState(null);
  const [lastAlert, setLastAlert] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getLiveEvent().then(setEvent).catch(() => {});
  }, []);

  const trigger = async (action) => {
    setError('');
    try {
      const result = await sendSOS({
        type: action.type,
        message: `${action.type} requested from attendee app`,
        lat: location.lat || 12.9716,
        lng: location.lng || 77.5946
      });
      setLastAlert(result);
    } catch (err) {
      setError(err.message || 'Unable to send alert');
    }
  };

  const firstAid = event?.firstAid || [];

  return (
    <PageTransition className='space-y-4 p-4' role='main' aria-label='Emergency page'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>Emergency & Safety</h1>
        <p className='text-sm text-white/70'>Tap once. Your GPS and alert type are routed to the nearest marshal.</p>
      </div>

      <section className='grid grid-cols-2 gap-3'>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.type}
              className={`min-h-28 rounded-lg p-4 text-left font-bold ${action.tone}`}
              onClick={() => trigger(action)}
              aria-label={`Send ${action.label} alert`}
            >
              <Icon aria-hidden='true' size={26} />
              <span className='mt-4 block'>{action.label}</span>
            </button>
          );
        })}
      </section>

      {lastAlert ? (
        <p className='rounded-lg border border-success/30 bg-success/15 p-4 text-sm'>
          Alert sent. Responder: {lastAlert.responderId || 'nearest available marshal'}.
        </p>
      ) : null}
      {error ? <p className='rounded-md bg-danger/15 p-3 text-sm text-red-100'>{error}</p> : null}

      <section className='space-y-3'>
        <h2 className='font-heading text-lg font-bold'>First Aid Locator</h2>
        <VenueMap markers={firstAid.map((item) => ({ ...item, latitude: item.lat, longitude: item.lng }))} className='h-72 rounded-lg' />
        {firstAid.map((item) => (
          <p key={item.id} className='rounded-md bg-white/[0.06] p-3 text-sm'>
            {item.name} ({item.type})
          </p>
        ))}
      </section>
    </PageTransition>
  );
}
