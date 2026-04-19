import PageTransition from '../../components/common/PageTransition';
import useCrowd from '../../hooks/useCrowd';
import { useCrowdStore } from '../../store/useCrowdStore';
import { densityColor } from '../../utils/crowdUtils';

export default function CrowdStatusPage() {
  useCrowd();
  const zones = useCrowdStore((s) => s.zones);

  return (
    <PageTransition className='space-y-4 p-4' role='main' aria-label='Crowd status page'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>Crowd Status</h1>
        <p className='text-sm text-white/70'>Green is smooth, amber is busy, red is high, purple is critical.</p>
      </div>
      {zones.map((zone) => {
        const ratio = Number(zone.currentCount || 0) / Number(zone.capacity || 1);
        return (
          <section key={zone.id} className='rounded-lg border border-white/10 bg-white/[0.06] p-4'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <h2 className='font-heading text-lg font-bold'>{zone.name}</h2>
                <p className='text-sm text-white/70'>
                  {(zone.currentCount || 0).toLocaleString()} / {(zone.capacity || 0).toLocaleString()} people
                </p>
              </div>
              <span className='rounded-full px-3 py-1 text-sm font-bold text-navy' style={{ background: densityColor(ratio) }}>
                {Math.round(ratio * 100)}%
              </span>
            </div>
            <div className='mt-3 h-2 overflow-hidden rounded-full bg-white/10'>
              <div className='h-full' style={{ width: `${Math.min(100, ratio * 100)}%`, background: densityColor(ratio) }} />
            </div>
          </section>
        );
      })}
    </PageTransition>
  );
}
