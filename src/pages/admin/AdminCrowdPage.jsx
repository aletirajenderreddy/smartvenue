import { useEffect, useState, useCallback } from 'react';
import { MapPin, Sliders } from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../config/supabase';
import { getCrowdTier } from '../../utils/crowd';

export default function AdminCrowdPage() {
  const { activeEvent } = useAuth();
  const { push } = useToast();
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
    const channel = supabase.channel('admin-crowd-page');
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'zones' }, load);
    channel.subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  async function update(zoneId, patch) {
    const { error } = await supabase.from('zones').update(patch).eq('id', zoneId);
    if (error) push(error.message, 'error');
    else load();
  }

  const totalAttendance = zones.reduce((sum, z) => sum + (z.crowd_density || 0), 0);
  const avgDensity = zones.length ? Math.round(totalAttendance / zones.length) : 0;
  const highZones = zones.filter((z) => z.crowd_density > 70).length;

  return (
    <PageTransition className='space-y-6'>
      <div>
        <h1 className='font-heading text-2xl font-bold flex items-center gap-2'>
          <MapPin size={24} className='text-primary' /> Crowd Monitor
        </h1>
        <p className='mt-0.5 text-sm text-white/50'>Real-time zone density control</p>
      </div>

      {/* Summary */}
      <div className='grid grid-cols-3 gap-3'>
        <div className='rounded-2xl border border-white/10 bg-white/5 p-4 text-center'>
          <p className='text-xs text-white/40'>Avg density</p>
          <p className='font-heading text-2xl font-black text-white mt-1'>{avgDensity}%</p>
        </div>
        <div className='rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center'>
          <p className='text-xs text-red-300/70'>High zones</p>
          <p className='font-heading text-2xl font-black text-red-300 mt-1'>{highZones}</p>
        </div>
        <div className='rounded-2xl border border-white/10 bg-white/5 p-4 text-center'>
          <p className='text-xs text-white/40'>Total zones</p>
          <p className='font-heading text-2xl font-black text-white mt-1'>{zones.length}</p>
        </div>
      </div>

      {/* Color legend */}
      <div className='flex gap-4 flex-wrap text-xs font-semibold'>
        <span className='flex items-center gap-1.5 text-emerald-400'><span className='h-2.5 w-2.5 rounded-full bg-emerald-400' /> Low ≤40%</span>
        <span className='flex items-center gap-1.5 text-amber-400'><span className='h-2.5 w-2.5 rounded-full bg-amber-400' /> Medium 41-70%</span>
        <span className='flex items-center gap-1.5 text-red-400'><span className='h-2.5 w-2.5 rounded-full bg-red-400' /> High &gt;70%</span>
      </div>

      {loading ? (
        <div className='space-y-3'>
          {[1,2,3,4].map((i) => <div key={i} className='h-36 animate-pulse rounded-2xl bg-white/10' />)}
        </div>
      ) : zones.length ? (
        <div className='space-y-4'>
          {zones.map((zone) => {
            const tier = getCrowdTier(zone.crowd_density);
            return (
              <div key={zone.id} className={`rounded-2xl border p-5 ${tier.border} ${tier.bg}`}>
                <div className='flex items-center justify-between gap-3 flex-wrap'>
                  <div>
                    <h3 className='font-semibold text-white'>{zone.name}</h3>
                    <p className={`text-sm font-bold ${tier.text}`}>{tier.emoji} {tier.label} · {zone.crowd_density}%</p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <select
                      className='rounded-xl border border-white/10 bg-[#111827] px-3 py-1.5 text-sm text-white'
                      value={zone.status}
                      onChange={(e) => update(zone.id, { status: e.target.value })}
                    >
                      <option value='open'>Open</option>
                      <option value='busy'>Busy</option>
                      <option value='closed'>Closed</option>
                    </select>
                  </div>
                </div>

                <div className='mt-4'>
                  <div className='mb-2 h-2 overflow-hidden rounded-full bg-white/10'>
                    <div className={`h-full rounded-full transition-all duration-500 ${tier.bar}`} style={{ width: `${zone.crowd_density}%` }} />
                  </div>
                  <div className='flex items-center gap-3'>
                    <Sliders size={14} className='text-white/40 shrink-0' />
                    <input
                      type='range'
                      min='0'
                      max='100'
                      value={zone.crowd_density}
                      onChange={(e) => update(zone.id, { crowd_density: Number(e.target.value) })}
                      className='flex-1 accent-primary'
                    />
                    <span className={`text-sm font-bold min-w-[3rem] text-right ${tier.text}`}>{zone.crowd_density}%</span>
                  </div>
                </div>

                {zone.crowd_density > 70 ? (
                  <div className='mt-3 rounded-xl bg-red-900/30 border border-red-500/20 px-3 py-2 text-xs text-red-300'>
                    ⚠️ High crowd! Consider redirecting attendees to Zone {zones.find(z => z.crowd_density < 50 && z.id !== zone.id)?.name || 'another area'}.
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={MapPin} title='No zones configured' description='Zones are created automatically when you create an event.' />
      )}
    </PageTransition>
  );
}
