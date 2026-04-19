import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, Shield } from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../config/supabase';
import { timeAgo } from '../../utils/crowd';

export default function AdminSosPage() {
  const { activeEvent, profile } = useAuth();
  const { push } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  const load = useCallback(async () => {
    if (!activeEvent?.id) return;
    let q = supabase.from('sos_requests').select('*').eq('event_id', activeEvent.id).order('created_at', { ascending: false });
    if (filter === 'active') q = q.neq('status', 'resolved');
    const { data } = await q;
    setAlerts(data || []);
    setLoading(false);
  }, [activeEvent?.id, filter]);

  useEffect(() => {
    load();
    const channel = supabase.channel('admin-sos-page');
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'sos_requests' }, load);
    channel.subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  async function handleResolve(alertId) {
    const { error } = await supabase.from('sos_requests').update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: profile?.id
    }).eq('id', alertId);
    if (error) push(error.message, 'error');
    else { push('Alert resolved ✅', 'success'); load(); }
  }

  const activeCount = alerts.filter((a) => a.status !== 'resolved').length;

  return (
    <PageTransition className='space-y-5'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='font-heading text-2xl font-bold flex items-center gap-2'>
            <Shield size={24} className='text-red-400' /> SOS Dashboard
          </h1>
          <p className='mt-0.5 text-sm text-white/50'>Emergency assistance requests</p>
        </div>
        {activeCount > 0 ? (
          <div className='flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/30 px-4 py-2'>
            <div className='h-2 w-2 rounded-full bg-red-400 animate-pulse' />
            <span className='text-sm font-bold text-red-300'>{activeCount} active</span>
          </div>
        ) : (
          <div className='flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-2'>
            <span className='text-sm font-bold text-emerald-300'>✅ All clear</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className='flex gap-2'>
        {['active', 'all'].map((f) => (
          <button
            key={f}
            type='button'
            onClick={() => setFilter(f)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold capitalize transition-colors ${
              filter === f ? 'border-primary/40 bg-primary/15 text-primary' : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className='space-y-3'>
          {[1,2,3].map((i) => <div key={i} className='h-28 animate-pulse rounded-2xl bg-white/10' />)}
        </div>
      ) : alerts.length ? (
        <div className='space-y-4'>
          {alerts.map((alert) => {
            const isResolved = alert.status === 'resolved';
            return (
              <div key={alert.id} className={`rounded-2xl border p-5 ${isResolved ? 'border-white/10 bg-white/5 opacity-60' : 'border-red-500/30 bg-red-500/10'}`}>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <p className='font-semibold text-white'>{alert.user_name || 'Unknown user'}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${isResolved ? 'bg-white/10 text-white/40' : 'bg-red-500/20 text-red-300'}`}>
                        {alert.status}
                      </span>
                    </div>
                    <p className='text-xs text-white/50 mt-0.5'>{timeAgo(alert.created_at)}</p>
                    {alert.message ? (
                      <p className='mt-2 text-sm text-white/80 leading-relaxed'>{alert.message}</p>
                    ) : null}
                    {alert.location?.latitude ? (
                      <p className='mt-1 text-xs text-white/50'>
                        📍 {Number(alert.location.latitude).toFixed(5)}, {Number(alert.location.longitude).toFixed(5)}
                      </p>
                    ) : null}
                  </div>
                </div>

                {!isResolved ? (
                  <div className='mt-4 flex flex-wrap gap-2'>
                    <button
                      type='button'
                      onClick={() => handleResolve(alert.id)}
                      className='flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors'
                    >
                      <CheckCircle2 size={15} /> Resolve
                    </button>
                    {alert.location?.latitude ? (
                      <a
                        href={`https://maps.google.com/?q=${alert.location.latitude},${alert.location.longitude}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors'
                      >
                        🗺️ View on map
                      </a>
                    ) : null}
                  </div>
                ) : (
                  <p className='mt-3 text-xs text-white/40'>Resolved {timeAgo(alert.resolved_at)}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Shield} title='No alerts' description={filter === 'active' ? 'No active SOS alerts right now.' : 'No SOS alerts recorded yet.'} />
      )}
    </PageTransition>
  );
}
