import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';
import useGeolocation from '../../hooks/useGeolocation';
import useQueue from '../../hooks/useQueue';
import { useCartStore } from '../../store/useCartStore';

function distanceKm(a, b) {
  const lat1 = Number(a.lat);
  const lng1 = Number(a.lng);
  const lat2 = Number(b.lat);
  const lng2 = Number(b.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return 99;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(s1 + s2), Math.sqrt(1 - s1 - s2));
}

export default function MenuPage() {
  const stalls = useQueue();
  const location = useGeolocation();
  const add = useCartStore((s) => s.add);
  const items = useCartStore((s) => s.items);
  const navigate = useNavigate();

  const sorted = useMemo(
    () =>
      [...stalls]
        .map((stall) => ({
          ...stall,
          distance: distanceKm(location, { lat: stall.latitude, lng: stall.longitude })
        }))
        .sort((a, b) => a.distance + Number(a.waitMinutes || 0) / 60 - (b.distance + Number(b.waitMinutes || 0) / 60)),
    [location, stalls]
  );

  return (
    <PageTransition role='main' aria-label='Food ordering page' className='space-y-4 p-4'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <h1 className='font-heading text-2xl font-bold'>Smart Food Ordering</h1>
          <p className='text-sm text-white/70'>Sorted by proximity and live wait time.</p>
        </div>
        <button
          aria-label='Open cart page'
          className='relative grid h-12 w-12 place-items-center rounded-full bg-primary'
          onClick={() => navigate('/food/cart')}
        >
          <ShoppingCart aria-hidden='true' size={20} />
          {items.length ? (
            <span className='absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-xs font-bold'>
              {items.length}
            </span>
          ) : null}
        </button>
      </div>

      {sorted.map((stall) => (
        <section key={stall.id} className='rounded-lg border border-white/10 bg-white/[0.06] p-4'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <h2 className='font-heading text-lg font-bold'>{stall.name}</h2>
              <p className='text-sm text-white/70'>
                Zone {stall.zone} / {stall.waitMinutes || 0} min wait / {stall.distance.toFixed(1)} km
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${stall.isOpen ? 'bg-success text-navy' : 'bg-danger'}`}>
              {stall.isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          <div className='mt-3 space-y-2'>
            {(stall.menu || []).map((item) => (
              <button
                key={item.id || item.name}
                disabled={!stall.isOpen}
                aria-label={`Add ${item.name} to cart`}
                className='flex w-full items-center justify-between rounded-md bg-white/10 p-3 text-left disabled:opacity-50'
                onClick={() => add({ stallId: stall.id, name: item.name, price: item.price, quantity: 1 })}
              >
                <span>{item.name}</span>
                <span className='font-bold'>INR {item.price}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </PageTransition>
  );
}
