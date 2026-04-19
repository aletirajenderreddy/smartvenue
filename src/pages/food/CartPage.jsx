import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageTransition from '../../components/common/PageTransition';
import { auth } from '../../config/firebase';
import { createOrder, createPaymentOrder } from '../../services/food.service';
import { useCartStore } from '../../store/useCartStore';
import { loadRazorpayScript } from '../../utils/paymentUtils';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total)();
  const clear = useCartStore((s) => s.clear);
  const remove = useCartStore((s) => s.remove);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const checkout = async () => {
    if (!items.length || total <= 0) return;
    setBusy(true);
    setError('');
    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) throw new Error('Unable to load Razorpay checkout');

      const paymentOrder = await createPaymentOrder(total);
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'SmartVenueX',
        description: 'Food order payment',
        order_id: paymentOrder.orderId,
        handler: async (response) => {
          try {
            const id = await createOrder({
              userId: auth.currentUser.uid,
              stallId: items[0]?.stallId || 'stall-1',
              items,
              total,
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            });
            clear();
            navigate(`/food/order/${id}`);
          } catch (err) {
            setError(err.message || 'Payment verification failed');
            setBusy(false);
          }
        },
        theme: { color: '#1A73E8' }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err.message || 'Checkout failed');
      setBusy(false);
    }
  };

  return (
    <PageTransition className='space-y-4 p-4' role='main' aria-label='Cart page'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>Cart</h1>
        <p className='text-sm text-white/70'>Razorpay verifies payment before the kitchen sees the order.</p>
      </div>

      {items.length === 0 ? (
        <div className='rounded-lg border border-white/10 bg-white/[0.06] p-4'>
          <p>Your cart is empty.</p>
          <Link to='/food' className='mt-3 inline-block rounded-md bg-primary px-4 py-2 font-bold'>
            Browse Stalls
          </Link>
        </div>
      ) : null}

      {items.map((item, index) => (
        <div key={`${item.stallId}-${item.name}`} className='flex items-center justify-between gap-3 rounded-lg bg-white/[0.06] p-3'>
          <div>
            <p className='font-bold'>{item.name}</p>
            <p className='text-sm text-white/70'>
              Qty {item.quantity || 1} x INR {item.price}
            </p>
          </div>
          <button className='rounded-md bg-white/10 px-3 py-2 text-sm' onClick={() => remove(index)}>
            Remove
          </button>
        </div>
      ))}

      <section className='rounded-lg border border-white/10 bg-white/[0.06] p-4'>
        <p className='flex items-center justify-between font-heading text-xl font-bold'>
          <span>Total</span>
          <span>INR {total}</span>
        </p>
        <button
          aria-label='Pay with Razorpay'
          disabled={busy || !items.length}
          className='mt-4 w-full rounded-md bg-primary p-3 font-bold disabled:opacity-50'
          onClick={checkout}
        >
          {busy ? 'Opening payment...' : 'Pay with Razorpay'}
        </button>
      </section>

      {error ? <p className='rounded-md bg-danger/15 p-3 text-sm text-red-100'>{error}</p> : null}
    </PageTransition>
  );
}
