import PageTransition from '../../components/common/PageTransition';
import useCrowd from '../../hooks/useCrowd';
import { useAuth } from '../../hooks/useAuth';
import { useCrowdStore } from '../../store/useCrowdStore';

export default function SmartExitPage() {
  useCrowd();
  const { profile } = useAuth();
  const zones = useCrowdStore((s) => s.zones);
  const userZone = profile?.seatZone || localStorage.getItem('userZone') || '';
  const candidates = userZone
    ? zones.filter((zone) => (zone.name || '').toLowerCase().includes(String(userZone).toLowerCase()))
    : zones;
  const best = [...(candidates.length ? candidates : zones)].sort(
    (a, b) => (a.currentCount || 0) / (a.capacity || 1) - (b.currentCount || 0) / (b.capacity || 1)
  )[0];
  const ratio = best ? Math.round(((best.currentCount || 0) / (best.capacity || 1)) * 100) : 0;

  return (
    <PageTransition className='space-y-4 p-4' role='main' aria-label='Smart exit page'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>Smart Exit</h1>
        <p className='text-sm text-white/70'>Exit recommendations update when the war room starts your zone wave.</p>
      </div>
      <section className='rounded-lg border border-success/30 bg-success/15 p-5'>
        <p className='text-sm text-success'>Recommended exit</p>
        <h2 className='font-heading text-3xl font-bold'>{best?.recommendedExit || best?.name || 'Gate 2'}</h2>
        <p className='mt-2 text-sm text-white/75'>{best?.name || 'Your zone'} is currently {ratio}% full.</p>
      </section>
      <section className='grid grid-cols-2 gap-3'>
        <div className='rounded-lg bg-white/[0.06] p-4'>
          <p className='text-sm text-white/60'>Exit ETA</p>
          <p className='font-heading text-2xl font-bold'>{ratio > 75 ? 12 : 6} min</p>
        </div>
        <div className='rounded-lg bg-white/[0.06] p-4'>
          <p className='text-sm text-white/60'>Transport</p>
          <p className='font-heading text-xl font-bold'>Shuttle B</p>
        </div>
      </section>
      <section className='rounded-lg bg-white/[0.06] p-4'>
        <h2 className='font-heading text-lg font-bold'>Parking Direction</h2>
        <p className='mt-1 text-sm text-white/75'>Follow lane 3 to Parking P3. Scan out at the gate to unlock post-event feedback.</p>
      </section>
    </PageTransition>
  );
}
