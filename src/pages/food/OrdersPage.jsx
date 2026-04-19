import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, Circle, Clock, ClipboardList } from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { timeAgo } from '../../utils/crowd';

const STATUS_STEPS = ['pending', 'accepted', 'preparing', 'ready', 'completed'];

function OrderProgress({ status }) {
  const current = STATUS_STEPS.indexOf(status);
  const labels = { pending: '⏳ Pending', accepted: '✅ Accepted', preparing: '🍳 Preparing', ready: '🔔 Ready!', completed: '✨ Collected' };

  return (
    <div className='flex items-center gap-1 overflow-x-auto pb-1'>
      {STATUS_STEPS.map((step, i) => {
        const done = i <= current;
        const isActive = i === current;
        return (
          <div key={step} className='flex items-center gap-1'>
            <div className={`flex flex-col items-center gap-1 ${i > 3 ? 'hidden sm:flex' : ''}`}>
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors ${
                done ? (isActive ? 'bg-primary text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-emerald-600/80 text-white') : 'bg-white/10 text-white/30'
              }`}>
                {done && !isActive ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              </div>
              <span className={`text-[9px] leading-none font-semibold whitespace-nowrap ${isActive ? 'text-primary' : done ? 'text-emerald-400' : 'text-white/30'}`}>
                {labels[step]}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 ? (
              <div className={`h-0.5 w-4 shrink-0 rounded-full transition-colors ${i < current ? 'bg-emerald-600' : 'bg-white/10'}`} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (!participant) { setLoading(false); return; }

    const { data } = await supabase
      .from('orders')
      .select('*, stalls(name)')
      .eq('participant_id', participant.id)
      .order('created_at', { ascending: false });

    setOrders(data || []);
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    load();
    const channel = supabase.channel('participant-orders');
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load);
    channel.subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  if (loading) {
    return (
      <PageTransition className='space-y-4'>
        {[1, 2].map((i) => <div key={i} className='h-36 animate-pulse rounded-2xl bg-white/10' />)}
      </PageTransition>
    );
  }

  return (
    <PageTransition className='space-y-5'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>📦 My Orders</h1>
        <p className='mt-0.5 text-sm text-white/50'>Real-time order tracking</p>
      </div>

      {orders.length ? (
        <div className='space-y-4'>
          {orders.map((order) => (
            <div
              key={order.id}
              className={`rounded-2xl border p-5 transition-all ${
                order.status === 'ready'
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='font-semibold text-white'>{order.stalls?.name || 'Stall'}</p>
                  <p className='text-xs text-white/50'>{timeAgo(order.created_at)} · ₹{Number(order.total_price).toFixed(2)}</p>
                </div>
                {order.status === 'ready' ? (
                  <span className='rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white animate-pulse'>
                    READY! 🔔
                  </span>
                ) : (
                  <span className='rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-white/60 uppercase'>
                    {order.status}
                  </span>
                )}
              </div>

              <div className='mt-3 flex flex-wrap gap-1.5'>
                {(Array.isArray(order.items) ? order.items : []).map((item, i) => (
                  <span key={i} className='rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/70'>
                    {typeof item === 'object' ? `${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}` : item}
                  </span>
                ))}
              </div>

              <div className='mt-4'>
                <OrderProgress status={order.status} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={ClipboardList} title='No orders yet' description='Browse stalls and place your first order!' />
      )}
    </PageTransition>
  );
}
