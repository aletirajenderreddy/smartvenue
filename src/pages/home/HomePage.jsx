import { Link } from 'react-router-dom';
import { AlertTriangle, Bus, Gamepad2, MapPinned, QrCode, ShieldAlert, ShoppingBag, Waypoints } from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';
import useCrowd from '../../hooks/useCrowd';
import { useAuth } from '../../hooks/useAuth';
import { useCrowdStore } from '../../store/useCrowdStore';

const actions = [
  { to: '/ticket', label: 'Smart Ticket', icon: QrCode, tone: 'bg-primary' },
  { to: '/map', label: 'Live Map', icon: MapPinned, tone: 'bg-success' },
  { to: '/food', label: 'Food', icon: ShoppingBag, tone: 'bg-warning text-black' },
  { to: '/emergency', label: 'Safety', icon: ShieldAlert, tone: 'bg-danger' },
  { to: '/transport', label: 'Transport', icon: Bus, tone: 'bg-white/15' },
  { to: '/exit', label: 'Smart Exit', icon: Waypoints, tone: 'bg-white/15' },
  { to: '/game', label: 'Trivia', icon: Gamepad2, tone: 'bg-white/15' },
  { to: '/lost-found', label: 'Lost Found', icon: AlertTriangle, tone: 'bg-white/15' }
];

export default function HomePage() {
  useCrowd();
  const { profile } = useAuth();
  const zones = useCrowdStore((s) => s.zones);
  const busiest = [...zones].sort((a, b) => (b.currentCount || 0) / (b.capacity || 1) - (a.currentCount || 0) / (a.capacity || 1))[0];
  const attendance = zones.reduce((sum, zone) => sum + Number(zone.currentCount || 0), 0);

  return (
    <PageTransition role='main' aria-label='Attendee home' className='space-y-5 p-4'>
      <section className='rounded-lg border border-white/10 bg-white/[0.06] p-5'>
        <p className='text-sm text-success'>Live event companion</p>
        <h1 className='font-heading text-3xl font-bold'>Hi {profile?.name?.split(' ')[0] || 'Fan'}</h1>
        <p className='mt-2 text-sm text-white/75'>
          Current attendance is {attendance.toLocaleString()} people. {busiest?.name || 'Zone A'} is the busiest area right now.
        </p>
      </section>

      <section className='grid grid-cols-2 gap-3'>
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={`Open ${item.label}`}
              className='rounded-lg border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/10'
            >
              <span className={`mb-3 grid h-10 w-10 place-items-center rounded-md ${item.tone}`}>
                <Icon aria-hidden='true' size={20} />
              </span>
              <span className='font-bold'>{item.label}</span>
            </Link>
          );
        })}
      </section>

      {profile?.role === 'admin' ? (
        <Link to='/admin' className='block rounded-lg bg-accent p-4 text-center font-bold text-white'>
          Open Admin War Room
        </Link>
      ) : null}
    </PageTransition>
  );
}
