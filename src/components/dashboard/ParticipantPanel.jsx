import { useState } from 'react';
import Section from './Section';
import CrowdMap from '../maps/CrowdMap';
import ScheduleTimeline from '../schedule/ScheduleTimeline';
import OrdersList from './OrdersList';
import NotificationsList from './NotificationsList';
import PassCard from '../participant/PassCard';
import { createOrder, sendSosAlert } from '../../services/eventflow.service';

export default function ParticipantPanel({ dashboard, activeEvent, setError, setNotice, refresh }) {
  const [orderForm, setOrderForm] = useState({ stallId: '', items: '', totalPrice: '0' });
  const [sosMessage, setSosMessage] = useState('');

  async function handleCreateOrder(e) {
    e.preventDefault();
    try {
      await createOrder({
        participantId: dashboard.participant.id,
        stallId: orderForm.stallId,
        items: orderForm.items,
        totalPrice: orderForm.totalPrice,
      });
      setOrderForm({ stallId: '', items: '', totalPrice: '0' });
      setNotice('Order placed successfully.');
      await refresh();
    } catch (err) {
      setError(err.message || 'Unable to place order');
    }
  }

  async function handleSos() {
    try {
      const location = await new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({});
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) =>
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          () => resolve({})
        );
      });

      await sendSosAlert({
        eventId: activeEvent.id,
        message: sosMessage || 'Assistance requested from participant dashboard',
        location,
      });
      setSosMessage('');
      setNotice('SOS sent to event admins.');
      await refresh();
    } catch (err) {
      setError(err.message || 'Unable to send SOS alert');
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
      {/* Pass Card */}
      <Section title="My Event Pass" subtitle="Scan to verify • seat · WiFi · helplines">
        <PassCard participant={dashboard.participant} event={activeEvent} />
      </Section>

      {/* Event Schedule */}
      <Section title="Event Schedule" subtitle="What's happening today">
        <ScheduleTimeline schedule={dashboard.schedule} emptyMessage="Schedule not published yet. Check back soon!" />
      </Section>

      {/* Live Crowd Map */}
      <Section title="Live Crowd Map" subtitle="Find the least crowded zones">
        <CrowdMap zones={dashboard.zones} event={activeEvent} readOnly={true} />
      </Section>

      {/* Food orders */}
      <Section title="Food Ordering" subtitle="Skip the line">
        <form className="grid gap-3 md:grid-cols-[1fr,2fr,1fr]" onSubmit={handleCreateOrder}>
          <select
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm focus:border-primary"
            value={orderForm.stallId}
            onChange={(e) => setOrderForm((cur) => ({ ...cur, stallId: e.target.value }))}
            required
          >
            <option value="">Select Stall</option>
            {dashboard.stalls.map((stall) => (
              <option key={stall.id} value={stall.id}>
                {stall.name} ({stall.location_zone})
              </option>
            ))}
          </select>
          <input
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm focus:border-primary"
            placeholder="Items (comma separated)"
            value={orderForm.items}
            onChange={(e) => setOrderForm((cur) => ({ ...cur, items: e.target.value }))}
            required
          />
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm focus:border-primary"
              placeholder="Total"
              value={orderForm.totalPrice}
              onChange={(e) => setOrderForm((cur) => ({ ...cur, totalPrice: e.target.value }))}
              required
            />
            <button type="submit" className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover shadow-lg shadow-primary/20 transition">
              Order
            </button>
          </div>
        </form>
        <div className="mt-8 border-t border-white/5 pt-6">
          <OrdersList orders={dashboard.orders} role="participant" onStatusChange={() => {}} />
        </div>
      </Section>

      {/* Notifications & Emergency */}
      <Section title="Announcements & Emergency" subtitle="Live updates and SOS requests">
        <div className="space-y-3">
          <NotificationsList notifications={dashboard.notifications} />
        </div>
        <div className="mt-6 border-t border-white/5 pt-6">
          <h3 className="font-heading text-lg font-semibold text-danger mb-3">SOS Alert</h3>
          <textarea
            className="min-h-24 w-full rounded-xl border border-danger/30 bg-black/40 p-3 text-sm focus:border-danger transition resize-none shadow-[inset_0_0_15px_rgba(239,68,68,0.05)]"
            placeholder="Need urgent help near..."
            value={sosMessage}
            onChange={(e) => setSosMessage(e.target.value)}
          />
          <button type="button" onClick={handleSos} className="mt-3 rounded-xl bg-danger px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-danger/20 hover:bg-red-600 transition">
            Send SOS
          </button>
        </div>
      </Section>
    </div>
  );
}
