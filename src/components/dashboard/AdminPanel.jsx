import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import Section from './Section';
import CrowdMap from '../maps/CrowdMap';
import ScheduleTimeline from '../schedule/ScheduleTimeline';
import OrdersList from './OrdersList';
import NotificationsList from './NotificationsList';
import { createNotification } from '../../services/eventflow.service';

export default function AdminPanel({ dashboard, activeEvent, handleZoneUpdate, handleStatus, refresh, setError, setNotice }) {
  const navigate = useNavigate();
  const [notificationForm, setNotificationForm] = useState({ message: '', targetRole: '' });

  async function handleNotificationSubmit(e) {
    e.preventDefault();
    try {
      await createNotification({
        eventId: activeEvent.id,
        message: notificationForm.message,
        targetRole: notificationForm.targetRole || null,
      });
      setNotificationForm({ message: '', targetRole: '' });
      setNotice('Notification sent.');
      await refresh();
    } catch (err) {
      setError(err.message || 'Unable to send notification');
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      {/* Live Crowd Map */}
      <Section title="Live Crowd Map" subtitle="Real-time density across event zones">
        <CrowdMap
          zones={dashboard.zones}
          event={activeEvent}
          readOnly={false}
          onZoneClick={(zone) => {
            const newDensity = Number(window.prompt(`Set density for "${zone.name}" (0–100):`, zone.crowd_density));
            if (!isNaN(newDensity)) handleZoneUpdate(zone.id, { crowd_density: Math.min(100, Math.max(0, newDensity)) });
          }}
        />
        {/* Zone sliders below map */}
        <div className="mt-4 space-y-3">
          {dashboard.zones.map((zone) => (
            <div key={zone.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur transition hover:bg-white/[0.05]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-white">{zone.name}</p>
                  <p className="text-sm text-white/50">Density {zone.crowd_density}%</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={zone.crowd_density}
                    onChange={(e) => handleZoneUpdate(zone.id, { crowd_density: Number(e.target.value) })}
                    className="accent-primary"
                  />
                  <select
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-primary"
                    value={zone.status}
                    onChange={(e) => handleZoneUpdate(zone.id, { status: e.target.value })}
                  >
                    <option value="open">Open</option>
                    <option value="busy">Busy</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Broadcast"
        subtitle="Push event-wide notices"
        actions={
          <button type="button" onClick={() => refresh()} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors">
            Refresh
          </button>
        }
      >
        <form className="space-y-3" onSubmit={handleNotificationSubmit}>
          <textarea
            className="min-h-24 w-full rounded-xl border border-white/10 bg-black/40 p-4 text-sm focus:border-primary transition-colors resize-none"
            placeholder="e.g. Main stage schedule update..."
            value={notificationForm.message}
            onChange={(e) => setNotificationForm((cur) => ({ ...cur, message: e.target.value }))}
            required
          />
          <div className="flex flex-wrap gap-3">
            <select
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-primary"
              value={notificationForm.targetRole}
              onChange={(e) => setNotificationForm((cur) => ({ ...cur, targetRole: e.target.value }))}
            >
              <option value="">All roles</option>
              <option value="participant">Participants</option>
              <option value="vendor">Vendors</option>
              <option value="admin">Admins</option>
            </select>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
              Send Alert
            </button>
          </div>
        </form>
        <div className="mt-6">
          <NotificationsList notifications={dashboard.notifications} />
        </div>
      </Section>

      {/* Event Schedule */}
      <Section
        title="Event Schedule"
        subtitle="Timeline visible to participants"
        actions={
          <button type="button" onClick={() => navigate('/admin/schedule')} className="flex items-center gap-2 rounded-xl bg-primary/20 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/30 transition-colors">
            <Calendar size={14} /> Manage
          </button>
        }
      >
        <ScheduleTimeline schedule={dashboard.schedule} emptyMessage="No sessions setup." />
      </Section>

      {/* Participants */}
      <Section title="Participants" subtitle="Attendees by seat number">
        <div className="grid gap-3">
          {dashboard.participants.map((participant) => (
            <div key={participant.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur hover:bg-white/[0.05] transition">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{participant.full_name}</p>
                  <p className="text-xs text-white/50">{participant.email} • {participant.phone_number}</p>
                </div>
                {participant.seat_number && (
                  <div className="flex-shrink-0 rounded-xl bg-accent/10 border border-accent/20 px-3 py-1.5 text-center">
                    <p className="text-[10px] text-accent font-bold uppercase tracking-wide">Seat</p>
                    <p className="text-lg font-black text-white">{participant.seat_number}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          {!dashboard.participants.length && <p className="text-sm font-medium text-white/50 py-4 text-center">No participants yet.</p>}
        </div>
      </Section>

      {/* Vendors & SOS */}
      <Section title="Vendors & SOS" subtitle="Stall operators and incident alerts">
        <div className="space-y-4">
          <div className="space-y-3">
            {dashboard.vendors.map((vendor) => (
              <div key={vendor.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                <p className="font-semibold text-white">{vendor.vendor_name}</p>
                <p className="text-xs text-white/60">Owner: {vendor.owner_name} • Stall: {vendor.stall_name || 'Pending'}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-4">
            <h3 className="font-heading text-lg font-semibold text-danger">Active SOS Alerts</h3>
            <div className="mt-3 space-y-3">
              {dashboard.sos.length ? (
                dashboard.sos.map((alert) => (
                  <div key={alert.id} className="rounded-xl border border-danger/30 bg-danger/10 p-4 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-danger">Alert #{alert.id.slice(0, 6)}</p>
                      <span className="rounded-full bg-danger/20 px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-danger">{alert.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-white/80">{alert.message || 'No message provided'}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm font-medium text-white/50 text-center py-2">No active SOS alerts.</p>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Orders */}
      <Section title="Orders Queue" subtitle="Real-time queue across all stalls">
        <OrdersList orders={dashboard.orders} onStatusChange={handleStatus} role="admin" />
      </Section>
    </div>
  );
}
