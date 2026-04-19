import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageTransition from '../../components/common/PageTransition';
import { db } from '../../config/firebase';
import { exportReport } from '../../services/admin.service';

export default function AnalyticsPage() {
  const [feedback, setFeedback] = useState([]);
  const [orders, setOrders] = useState([]);
  const [zones, setZones] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([getDocs(collection(db, 'feedback')), getDocs(collection(db, 'orders')), getDocs(collection(db, 'zones'))]).then(
      ([feedbackSnap, orderSnap, zoneSnap]) => {
        setFeedback(feedbackSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setOrders(orderSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setZones(zoneSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );
  }, []);

  const sentiment = useMemo(
    () => [
      { name: 'positive', value: feedback.filter((row) => row.sentiment === 'positive').length },
      { name: 'neutral', value: feedback.filter((row) => row.sentiment === 'neutral').length },
      { name: 'negative', value: feedback.filter((row) => row.sentiment === 'negative').length }
    ],
    [feedback]
  );

  const stallWaits = useMemo(() => {
    const byStall = {};
    orders.forEach((order) => {
      byStall[order.stallId] = byStall[order.stallId] || { name: order.stallId || 'stall', orders: 0 };
      byStall[order.stallId].orders += 1;
    });
    return Object.values(byStall);
  }, [orders]);

  const downloadCsv = async () => {
    try {
      const result = await exportReport({ eventId: 'demoEvent' });
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'smartvenuex-feedback.csv';
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage('CSV exported.');
    } catch (err) {
      setMessage(err.message || 'Export failed');
    }
  };

  return (
    <PageTransition className='space-y-5 p-6' role='main' aria-label='Analytics page'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='font-heading text-2xl font-bold'>Analytics</h1>
          <p className='text-sm text-white/70'>Crowd peaks, stall demand, throughput, and Gemini feedback sentiment.</p>
        </div>
        <button className='rounded-md bg-primary px-4 py-3 font-bold' onClick={downloadCsv}>
          Export CSV
        </button>
      </div>
      <section className='grid gap-4 lg:grid-cols-3'>
        <div className='rounded-lg border border-white/10 bg-white/[0.06] p-4'>
          <h2 className='font-heading text-lg font-bold'>Feedback Sentiment</h2>
          <div className='h-72'>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={sentiment} dataKey='value' nameKey='name'>
                  {sentiment.map((_, index) => (
                    <Cell key={index} fill={['#34A853', '#F9AB00', '#EA4335'][index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className='rounded-lg border border-white/10 bg-white/[0.06] p-4'>
          <h2 className='font-heading text-lg font-bold'>Crowd Peak Overlay</h2>
          <div className='h-72'>
            <ResponsiveContainer>
              <BarChart data={zones.map((zone) => ({ name: zone.name, value: zone.currentCount || 0 }))}>
                <XAxis dataKey='name' stroke='#fff' />
                <YAxis stroke='#fff' />
                <Tooltip />
                <Bar dataKey='value' fill='#1A73E8' />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className='rounded-lg border border-white/10 bg-white/[0.06] p-4'>
          <h2 className='font-heading text-lg font-bold'>Orders By Stall</h2>
          <div className='h-72'>
            <ResponsiveContainer>
              <BarChart data={stallWaits}>
                <XAxis dataKey='name' stroke='#fff' />
                <YAxis stroke='#fff' />
                <Tooltip />
                <Bar dataKey='orders' fill='#34A853' />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
      {message ? <p className='rounded-md bg-white/10 p-3 text-sm'>{message}</p> : null}
    </PageTransition>
  );
}
