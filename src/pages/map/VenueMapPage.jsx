import PageTransition from '../../components/common/PageTransition';
import VenueMap from '../../components/maps/VenueMap';
import useCrowd from '../../hooks/useCrowd';
import useQueue from '../../hooks/useQueue';
import { useCrowdStore } from '../../store/useCrowdStore';

export default function VenueMapPage() {
  useCrowd();
  const stalls = useQueue();
  const zones = useCrowdStore((s) => s.zones);

  return (
    <PageTransition className='space-y-4 p-4' role='main' aria-label='Venue map page'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>Live Crowd Heatmap</h1>
        <p className='text-sm text-white/70'>Heat intensity updates from Firestore zones and the Realtime Database crowd feed.</p>
      </div>
      <VenueMap markers={stalls} zones={zones} className='h-[420px] rounded-lg' />
      <section className='grid grid-cols-2 gap-2'>
        {zones.map((zone) => {
          const ratio = Number(zone.currentCount || 0) / Number(zone.capacity || 1);
          return (
            <div key={zone.id} className='rounded-lg border border-white/10 bg-white/[0.06] p-3'>
              <p className='font-bold'>{zone.name}</p>
              <p className='text-sm text-white/70'>{Math.round(ratio * 100)}% density</p>
            </div>
          );
        })}
      </section>
    </PageTransition>
  );
}
