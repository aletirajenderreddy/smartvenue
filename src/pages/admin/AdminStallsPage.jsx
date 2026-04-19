import { useEffect, useState, useCallback } from 'react';
import { Store } from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../config/supabase';

export default function AdminStallsPage() {
  const { activeEvent } = useAuth();
  const { push } = useToast();
  const [stalls, setStalls] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeEvent?.id) return;
    const [stallsRes, vendorsRes] = await Promise.all([
      supabase.from('stalls').select('*, vendors(vendor_name, owner_name, service_type)').eq('event_id', activeEvent.id).order('name'),
      supabase.from('vendors').select('*').eq('event_id', activeEvent.id).is('stall_name', null).order('vendor_name')
    ]);
    setStalls(stallsRes.data || []);
    setVendors(vendorsRes.data || []);
    setLoading(false);
  }, [activeEvent?.id]);

  useEffect(() => { load(); }, [load]);

  async function updateStall(stallId, patch) {
    const { error } = await supabase.from('stalls').update(patch).eq('id', stallId);
    if (error) push(error.message, 'error');
    else { push('Stall updated', 'success'); load(); }
  }

  async function assignVendor(stallId, vendorId, vendorName) {
    const stall = stalls.find(s => s.id === stallId);
    const { error } = await supabase.from('stalls').update({ vendor_id: vendorId, status: 'active' }).eq('id', stallId);
    if (!error) {
      await supabase.from('vendors').update({ stall_name: stall?.name }).eq('id', vendorId);
    }
    if (error) push(error.message, 'error');
    else { push(`${vendorName} assigned to stall!`, 'success'); load(); }
  }

  const statusColors = {
    unassigned: 'border-white/10 bg-white/5',
    active: 'border-emerald-500/20 bg-emerald-500/10',
    inactive: 'border-white/10 bg-white/5 opacity-60'
  };

  return (
    <PageTransition className='space-y-5'>
      <div>
        <h1 className='font-heading text-2xl font-bold flex items-center gap-2'><Store size={22} /> Stall Management</h1>
        <p className='mt-0.5 text-sm text-white/50'>{stalls.length} stalls · {stalls.filter(s => s.status === 'active').length} active</p>
      </div>

      {loading ? (
        <div className='space-y-3'>{[1,2,3].map(i => <div key={i} className='h-28 animate-pulse rounded-2xl bg-white/10' />)}</div>
      ) : stalls.length ? (
        <div className='grid gap-4 md:grid-cols-2'>
          {stalls.map((stall) => (
            <div key={stall.id} className={`rounded-2xl border p-5 ${statusColors[stall.status] || statusColors.unassigned}`}>
              <div className='flex items-start justify-between gap-2'>
                <div>
                  <p className='font-semibold text-white'>{stall.name}</p>
                  <p className='text-xs text-white/50'>Zone: {stall.location_zone}</p>
                </div>
                <select
                  className='rounded-xl border border-white/10 bg-[#111827] px-2 py-1 text-xs text-white'
                  value={stall.status}
                  onChange={(e) => updateStall(stall.id, { status: e.target.value })}
                >
                  <option value='unassigned'>Unassigned</option>
                  <option value='active'>Active</option>
                  <option value='inactive'>Inactive</option>
                </select>
              </div>

              {stall.vendors ? (
                <div className='mt-3 rounded-xl bg-white/5 px-3 py-2'>
                  <p className='text-xs font-semibold text-white'>{stall.vendors.vendor_name}</p>
                  <p className='text-[11px] text-white/50'>{stall.vendors.owner_name} · {stall.vendors.service_type}</p>
                </div>
              ) : vendors.length > 0 ? (
                <div className='mt-3'>
                  <p className='text-xs text-white/40 mb-1'>Assign vendor:</p>
                  <select
                    className='w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-xs text-white'
                    defaultValue=''
                    onChange={(e) => {
                      if (e.target.value) {
                        const v = vendors.find(v => v.id === e.target.value);
                        assignVendor(stall.id, e.target.value, v?.vendor_name);
                      }
                    }}
                  >
                    <option value=''>Select vendor...</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.vendor_name} ({v.service_type})</option>)}
                  </select>
                </div>
              ) : (
                <p className='mt-2 text-xs text-white/30'>No vendors waiting for assignment</p>
              )}

              <div className='mt-3 flex items-center justify-between'>
                <label className='text-xs text-white/40'>Queue time (min)</label>
                <div className='flex items-center gap-2'>
                  <input
                    type='number'
                    min='0'
                    value={stall.queue_time}
                    onChange={(e) => updateStall(stall.id, { queue_time: Number(e.target.value) })}
                    className='w-16 rounded-lg border border-white/10 bg-[#111827] px-2 py-1 text-center text-sm text-white'
                  />
                  <span className='text-xs text-white/40'>min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Store} title='No stalls' description='Stalls are generated when you create an event with a stall count.' />
      )}
    </PageTransition>
  );
}
