import { useEffect, useState, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { getCrowdTier } from '../../utils/crowd';

export default function ZonesPage() {
  const { activeEvent } = useAuth();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeEvent?.id) return;
    const { data } = await supabase.from('zones').select('*').eq('event_id', activeEvent.id).order('name');
    setZones(data || []);
    setLoading(false);
  }, [activeEvent?.id]);

  useEffect(() => {
    load();
    const channel = supabase.channel('zones-participant');
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'zones' }, load);
    channel.subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  if (loading) {
    return (
      <PageTransition className='space-y-3'>
        {[1, 2, 3, 4].map((i) => <div key={i} className='h-24 animate-pulse rounded-2xl bg-white/10' />)}
      </PageTransition>
    );
  }

  return (
    <PageTransition className='space-y-5'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>🗺️ Zone Overview</h1>
        <p className='mt-0.5 text-sm text-white/50'>Live crowd density — updated in real time</p>
      </div>

      <div className='flex gap-3 flex-wrap text-xs font-semibold'>
        <span className='flex items-center gap-1.5 text-emerald-400'><span className='h-2.5 w-2.5 rounded-full bg-emerald-400' /> Low (0-40%)</span>
        <span className='flex items-center gap-1.5 text-amber-400'><span className='h-2.5 w-2.5 rounded-full bg-amber-400' /> Medium (41-70%)</span>
        <span className='flex items-center gap-1.5 text-red-400'><span className='h-2.5 w-2.5 rounded-full bg-red-400' /> High (71-100%)</span>
      </div>

      {zones.length ? (
        <div className='space-y-3'>
          {zones.map((zone) => {
            const tier = getCrowdTier(zone.crowd_density);
            return (
              <div key={zone.id} className={`rounded-2xl border p-5 ${tier.border} ${tier.bg}`}>
                <div className='flex items-center justify-between gap-4'>
                  <div className='flex items-center gap-3'>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tier.bg}`}>
                      <MapPin size={18} className={tier.text} />
                    </div>
                    <div>
                      <p className='font-semibold text-white'>{zone.name}</p>
                      <p className={`text-xs font-bold ${tier.text}`}>
                        {tier.emoji} {tier.label} crowd · {zone.status}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className={`font-heading text-2xl font-black ${tier.text}`}>{zone.crowd_density}%</p>
                    <p className='text-[10px] text-white/40'>capacity</p>
                  </div>
                </div>
                <div className='mt-4 h-2 overflow-hidden rounded-full bg-white/10'>
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${tier.bar}`}
                    style={{ width: `${zone.crowd_density}%` }}
                  />
                </div>
                {zone.crowd_density > 70 ? (
                  <p className='mt-2 text-xs text-red-300'>⚠️ High crowd — consider visiting another zone</p>
                ) : zone.crowd_density <= 40 ? (
                  <p className='mt-2 text-xs text-emerald-300'>✅ Low traffic — good time to visit!</p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={MapPin} title='No zones configured' description='Zones will appear once the admin sets them up.' />
      )}
    </PageTransition>
  );
}
