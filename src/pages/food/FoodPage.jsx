import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, Minus, Plus, Trash2, Store } from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../config/supabase';

export default function FoodPage() {
  const { activeEvent, profile } = useAuth();
  const { push } = useToast();
  const [stalls, setStalls] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState({}); // { menu_item_id: quantity }
  const [selectedStall, setSelectedStall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const load = useCallback(async () => {
    if (!activeEvent?.id) return;
    setLoading(true);
    const [stallsRes, menuRes] = await Promise.all([
      supabase.from('stalls').select('*').eq('event_id', activeEvent.id).eq('status', 'active').order('name'),
      supabase.from('menu_items').select('*').eq('event_id', activeEvent.id).eq('is_available', true).order('category').order('name')
    ]);
    setStalls(stallsRes.data || []);
    setMenuItems(menuRes.data || []);
    if (stallsRes.data?.length && !selectedStall) setSelectedStall(stallsRes.data[0].id);
    setLoading(false);
  }, [activeEvent?.id]);

  useEffect(() => { load(); }, [load]);

  const filteredMenu = selectedStall ? menuItems.filter((m) => m.stall_id === selectedStall) : menuItems;

  function adjustCart(itemId, delta) {
    setCart((prev) => {
      const qty = (prev[itemId] || 0) + delta;
      if (qty <= 0) { const next = { ...prev }; delete next[itemId]; return next; }
      return { ...prev, [itemId]: qty };
    });
  }

  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menuItems.find((m) => m.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  async function placeOrder() {
    if (!cartCount || !selectedStall) return;
    setPlacing(true);
    try {
      // Get participant record
      const { data: participant } = await supabase
        .from('participants')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (!participant) throw new Error('Participant record not found. Complete onboarding first.');

      const items = Object.entries(cart).map(([id, qty]) => {
        const item = menuItems.find((m) => m.id === id);
        return { id, name: item?.name || id, quantity: qty, price: item?.price || 0 };
      });

      const { error } = await supabase.from('orders').insert({
        participant_id: participant.id,
        stall_id: selectedStall,
        items,
        total_price: cartTotal,
        status: 'pending'
      });

      if (error) throw error;
      push('Order placed! 🎉 Track it in the Orders tab.', 'success');
      setCart({});
    } catch (err) {
      push(err.message || 'Unable to place order', 'error');
    } finally {
      setPlacing(false);
    }
  }

  if (loading) {
    return (
      <PageTransition className='space-y-4'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='h-28 animate-pulse rounded-2xl bg-white/10' />
        ))}
      </PageTransition>
    );
  }

  return (
    <PageTransition className='space-y-5'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>🍽️ Food & Stalls</h1>
        <p className='mt-0.5 text-sm text-white/50'>Browse menus and place orders</p>
      </div>

      {/* Stall tabs */}
      {stalls.length > 0 ? (
        <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-none'>
          {stalls.map((stall) => (
            <button
              key={stall.id}
              type='button'
              onClick={() => setSelectedStall(stall.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                selectedStall === stall.id
                  ? 'border-primary/40 bg-primary/15 text-primary'
                  : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              <Store size={14} />
              {stall.name}
              {stall.queue_time > 0 ? (
                <span className='rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400'>
                  ~{stall.queue_time}m
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {/* Menu items */}
      {filteredMenu.length > 0 ? (
        <div className='space-y-3'>
          {filteredMenu.map((item) => {
            const qty = cart[item.id] || 0;
            return (
              <div key={item.id} className='flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4'>
                <div className='flex-1 min-w-0'>
                  <p className='font-semibold text-white'>{item.name}</p>
                  {item.description ? <p className='text-xs text-white/50 mt-0.5 truncate'>{item.description}</p> : null}
                  <p className='mt-1 font-mono text-sm font-bold text-primary'>₹{item.price}</p>
                </div>
                <div className='flex items-center gap-2'>
                  {qty > 0 ? (
                    <>
                      <button
                        type='button'
                        onClick={() => adjustCart(item.id, -1)}
                        className='flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors'
                      >
                        <Minus size={14} />
                      </button>
                      <span className='w-6 text-center font-bold text-white'>{qty}</span>
                    </>
                  ) : null}
                  <button
                    type='button'
                    onClick={() => adjustCart(item.id, 1)}
                    className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors'
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Store} title='No menu items' description='This stall has no items listed yet.' />
      )}

      {/* Cart bar */}
      {cartCount > 0 ? (
        <div className='sticky bottom-20 rounded-2xl border border-primary/30 bg-primary/15 p-4 shadow-2xl backdrop-blur-xl'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/30'>
                <ShoppingCart size={16} className='text-primary' />
              </div>
              <div>
                <p className='text-sm font-bold text-white'>{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
                <p className='text-xs text-white/60'>₹{cartTotal.toFixed(2)}</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => setCart({})}
                className='rounded-xl border border-white/10 px-3 py-2 text-xs text-white/50 hover:text-white transition-colors'
              >
                <Trash2 size={13} />
              </button>
              <button
                type='button'
                onClick={placeOrder}
                disabled={placing}
                className='rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors'
              >
                {placing ? 'Placing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageTransition>
  );
}
