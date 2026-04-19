import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../../components/common/PageTransition';
import Skeleton from '../../components/ui/skeleton';
import QRDisplay from '../../components/qr/QRDisplay';
import { auth } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { generateQR } from '../../services/ticket.service';
import { tokenToQR } from '../../utils/qrUtils';

export default function MyTicketPage() {
  const { profile } = useAuth();
  const [qr, setQr] = useState(localStorage.getItem('smartvenuex-ticket-qr') || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!qr);

  useEffect(() => {
    document.documentElement.style.filter = 'brightness(1.18)';
    return () => {
      document.documentElement.style.filter = '';
    };
  }, []);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    const slotId = profile?.slotId || localStorage.getItem('smartvenuex-slot-id');
    if (!uid || !slotId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const data = await generateQR({ userId: uid, eventId: 'demoEvent', slotId });
        const image = await tokenToQR(data.token);
        localStorage.setItem('smartvenuex-ticket-qr', image);
        setQr(image);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.slotId]);

  return (
    <PageTransition className='space-y-4 p-4' role='main' aria-label='My ticket page'>
      <section className='rounded-lg border border-white/10 bg-white/[0.06] p-4 text-center'>
        <p className='text-sm text-success'>Brightness boosted for gate scan</p>
        <h1 className='font-heading text-2xl font-bold'>My Smart Ticket</h1>
        <p className='text-sm text-white/70'>Gate staff can scan this QR to validate your arrival slot.</p>
      </section>

      {loading ? <Skeleton className='mx-auto aspect-square w-full max-w-sm' /> : null}
      {!loading && qr ? <QRDisplay src={qr} label='SmartVenueX ticket QR' /> : null}

      {!loading && !qr ? (
        <div className='rounded-lg border border-warning/40 bg-warning/10 p-4'>
          <p className='font-bold text-warning'>Choose an arrival slot first.</p>
          <p className='mt-1 text-sm text-white/75'>The secure QR is generated only after your slot and gate are assigned.</p>
          <Link to='/ticket/slot' className='mt-3 inline-block rounded-md bg-warning px-4 py-2 font-bold text-black'>
            Pick Slot
          </Link>
        </div>
      ) : null}

      {error ? <p className='rounded-md bg-danger/15 p-3 text-sm text-red-100'>{error}</p> : null}
    </PageTransition>
  );
}
