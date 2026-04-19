import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, Clock, Package } from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../config/supabase';
import { timeAgo } from '../../utils/crowd';

const ORDER_ACTIONS = {
  pending: { next: 'accepted', label: 'Accept', color: 'bg-primary', icon: CheckCircle2 },
  accepted: { next: 'preparing', label: 'Start Preparing', color: 'bg-amber-600', icon: Clock },
  preparing: { next: 'ready', label: 'Mark Ready', color: 'bg-emerald-600', icon: CheckCircle2 },
  ready: { next: 'completed', label: 'Mark Collected', color: 'bg-blue-600', icon: Package }
};

function OrderCard({ order, onStatusChange }) {
  const action = ORDER_ACTIONS[order.status];
  const [busy, setBusy] = useState(false);

  async function handleAction() {
    if (!action) return;
    setBusy(true);
    await onStatusChange(order.id, action.next);
    setBusy(false);
  }

  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      order.status === 'pending' ? 'border-amber-500/30 bg-amber-500/10' :
      order.status === 'ready' ? 'border-emerald-500/30 bg-emerald-500/10' :
      'border-white/10 bg-white/5'
    }`}>
      <div className='flex items-start justify-between gap-2'>
        <div>
          <p className='font-semibold text-white text-sm'>Order #{order.id.slice(0, 8)}</p>
          <p className='text-xs text-white/50'>{timeAgo(order.created_at)} · ₹{Number(order.total_price).toFixed(2)}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
          order.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
          order.status === 'ready' ? 'bg-emerald-500/20 text-emerald-300' :
          'bg-white/10 text-white/50'
        }`}>
          {order.status}
        </span>
      </div>

      <div className='mt-2 flex flex-wrap gap-1.5'>
        {(Array.isArray(order.items) ? order.items : []).map((item, i) => (
          <span key={i} className='rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/70'>
            {typeof item === 'object' ? `${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}` : item}
          </span>
        ))}
      </div>

      {action ? (
        <button
          type='button'
          onClick={handleAction}
          disabled={busy}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-50 ${action.color}`}
        >
          <action.icon size={15} />
          {busy ? 'Updating...' : action.label}
        </button>
      ) : null}
    </div>
  );
}

export default function VendorOrdersPage() {
  const { profile } = useAuth();
  const { push } = useToast();
  const [vendor, setVendor] = useState(null);
  const [stall, setStall] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    const { data: v } = await supabase.from('vendors').select('*').eq('profile_id', profile.id).maybeSingle();
    setVendor(v);

    if (v) {
      const { data: s } = await supabase.from('stalls').select('*').eq('vendor_id', v.id).maybeSingle();
      setStall(s);

      if (s) {
        const { data: o } = await supabase
          .from('orders')
          .select('*')
          .eq('stall_id', s.id)
          .neq('status', 'completed')
          .neq('status', 'cancelled')
          .order('created_at', { ascending: true });
        setOrders(o || []);
      }
    }
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    load();
    const channel = supabase.channel('vendor-orders');
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load);
    channel.subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  async function handleStatusChange(orderId, status) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) push(error.message, 'error');
    else { push(`Order moved to ${status}`, 'success'); await load(); }
  }

  if (loading) {
    return (
      <PageTransition className='space-y-4'>
        {[1, 2, 3].map((i) => <div key={i} className='h-32 animate-pulse rounded-2xl bg-white/10' />)}
      </PageTransition>
    );
  }

  return (
    <PageTransition className='space-y-5'>
      {/* Stall info */}
      {stall ? (
        <div className='rounded-2xl border border-primary/20 bg-primary/10 p-5'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <p className='text-xs font-bold uppercase tracking-widest text-primary mb-1'>My Stall</p>
              <h1 className='font-heading text-xl font-bold text-white'>{stall.name}</h1>
              <p className='text-sm text-white/60'>Zone: {stall.location_zone}</p>
            </div>
            <div className='text-right'>
              <p className='text-xs text-white/40'>Queue time</p>
              <p className='font-heading text-2xl font-black text-primary'>{stall.queue_time}m</p>
            </div>
          </div>
        </div>
      ) : (
        <div className='rounded-2xl border border-white/10 bg-white/5 p-5'>
          <p className='font-semibold text-white'>{vendor?.vendor_name || 'Vendor'}</p>
          <p className='text-sm text-white/50 mt-1'>Waiting for stall assignment from admin.</p>
        </div>
      )}

      <div>
        <h2 className='font-heading text-xl font-bold flex items-center gap-2'>
          <Package size={20} /> Order Queue
          {orders.length > 0 ? (
            <span className='rounded-full bg-amber-500/20 px-2 py-0.5 text-sm font-bold text-amber-300'>
              {orders.length}
            </span>
          ) : null}
        </h2>
        <p className='text-xs text-white/40 mt-0.5'>Accept → Preparing → Ready → Collected</p>
      </div>

      {orders.length ? (
        <div className='space-y-3'>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Package} title='No active orders' description='New orders will appear here in real time.' />
      )}
    </PageTransition>
  );
}
