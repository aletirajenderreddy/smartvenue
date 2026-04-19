import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from '../../components/common/PageTransition';
import QRDisplay from '../../components/qr/QRDisplay';
import { subscribeOrder } from '../../services/food.service';
import { tokenToQR } from '../../utils/qrUtils';

const steps = ['pending', 'preparing', 'ready', 'collected'];

export default function OrderTrackPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [qr, setQr] = useState('');

  useEffect(() => subscribeOrder(id, setOrder), [id]);

  useEffect(() => {
    if (order?.qrToken && order.status === 'ready') {
      tokenToQR(order.qrToken).then(setQr).catch(() => {});
    }
  }, [order?.qrToken, order?.status]);

  const active = Math.max(0, steps.indexOf(order?.status || 'pending'));

  return (
    <PageTransition className='space-y-4 p-4' role='main' aria-label='Order tracking page'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>Order Tracking</h1>
        <p className='text-sm text-white/70'>Live kitchen updates and collection QR.</p>
      </div>
      <section className='space-y-3'>
        {steps.map((step, index) => (
          <motion.div
            key={step}
            animate={{ opacity: index <= active ? 1 : 0.42, scale: index <= active ? 1.01 : 1 }}
            className={`rounded-lg border p-3 ${
              index <= active ? 'border-success bg-success/15' : 'border-white/10 bg-white/[0.06]'
            }`}
          >
            <p className='font-bold capitalize'>{step}</p>
          </motion.div>
        ))}
      </section>
      {order?.status === 'ready' && qr ? (
        <section className='space-y-3 rounded-lg border border-success/30 bg-success/10 p-4'>
          <p className='font-bold text-success'>Ready for collection</p>
          <QRDisplay src={qr} label='Food collection QR' />
        </section>
      ) : null}
    </PageTransition>
  );
}
