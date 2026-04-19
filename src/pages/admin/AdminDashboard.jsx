/**
 * AdminDashboard.jsx — Role-based Admin view.
 * Real-time data via Supabase Realtime channels (postgres_changes).
 * 
 * HOW REAL-TIME WORKS:
 * ─────────────────────────────────────────────────────────────────
 * 1. We call supabase.channel('unique-name') to open a WebSocket.
 * 2. We subscribe to postgres_changes (INSERT/UPDATE/DELETE).
 * 3. Any DB change triggers `load()` to re-fetch from the server.
 * 4. On unmount, we call supabase.removeChannel() to clean up.
 * 
 * WHERE TO USE REALTIME:
 * - SOS alerts (admin must see immediately)
 * - Participant/vendor join counts (live dashboard stats)
 * - Order status changes (vendor accepting orders)
 * - Zone density updates (crowd map)
 * - Broadcast notifications (admin → all roles)
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Calendar, CheckCircle2, ChevronRight,
  Inbox, MapPin, Radio, Shield,
  ShoppingBag, Store, Users, Zap
} from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';
import CrowdMap from '../../components/maps/CrowdMap';
import ChatbotButton from '../../components/chatbot/ChatbotButton';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../config/supabase';
import { getCrowdTier, timeAgo } from '../../utils/crowd';

/* ─── Generic realtime table hook ─────────────────────── */
function useTable(table, filter) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let q = supabase.from(table).select('*').order('created_at', { ascending: false });
    if (filter?.eq) q = q.eq(filter.eq[0], filter.eq[1]);
    const { data } = await q;
    setRows(data || []);
    setLoading(false);
  }, [table, JSON.stringify(filter)]);

  useEffect(() => {
    load();
    // Open WebSocket subscription for live updates
    const channel = supabase.channel(`admin-${table}-${Date.now()}`);
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, load);
    channel.subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  return { rows, loading, reload: load };
}

/* ─── Stat Card ───────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, tone, delay = 0, onClick }) {
  const tones = {
    primary: { bg: 'bg-primary/10 border-primary/20', icon: 'bg-primary/20 text-primary', glow: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]' },
    accent:  { bg: 'bg-accent/10  border-accent/20',  icon: 'bg-accent/20  text-accent',  glow: 'hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]' },
    success: { bg: 'bg-success/10 border-success/20', icon: 'bg-success/20 text-success', glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]'  },
    warning: { bg: 'bg-warning/10 border-warning/20', icon: 'bg-warning/20 text-warning', glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]'  },
    danger:  { bg: 'bg-danger/10  border-danger/20',  icon: 'bg-danger/20  text-danger',  glow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'   },
  };
  const t = tones[tone] || tones.primary;
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-md cursor-pointer transition-all ${t.bg} ${t.glow}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/40">{label}</p>
          <p className="mt-2 font-heading text-4xl font-black text-white">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.icon}`}>
          <Icon size={20} />
        </div>
      </div>
      {/* Decorative corner glow */}
      <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-white/5 blur-xl" />
    </motion.article>
  );
}

/* ─── Section container ───────────────────────────────── */
function Panel({ title, icon: Icon, badge, actions, children, delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-xl shadow-black/20"
    >
      <div className="flex items-center justify-between gap-4 border-b border-white/5 bg-white/[0.02] px-5 py-4">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={18} className="text-white/50" />}
          <h2 className="font-heading text-lg font-bold text-white">{title}</h2>
          {badge !== undefined && (
            <span className="rounded-full bg-danger/20 px-2.5 py-0.5 text-xs font-bold text-danger">{badge}</span>
          )}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </motion.section>
  );
}

/* ─── Zone card ───────────────────────────────────────── */
function ZoneCard({ zone, onUpdate }) {
  const tier = getCrowdTier(zone.crowd_density);
  return (
    <div className={`rounded-xl border p-4 transition hover:brightness-110 ${tier.border} ${tier.bg}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <p className="font-semibold text-white">{zone.name}</p>
          <p className={`text-xs font-bold ${tier.text}`}>{tier.emoji} {tier.label} · {zone.crowd_density}%</p>
        </div>
        <select
          className="rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-xs font-bold text-white backdrop-blur"
          value={zone.status}
          onChange={(e) => onUpdate(zone.id, { status: e.target.value })}
        >
          <option value="open">Open</option>
          <option value="busy">Busy</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10 mb-2">
        <div className={`h-full rounded-full transition-all duration-700 ${tier.bar}`} style={{ width: `${zone.crowd_density}%` }} />
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={zone.crowd_density}
        onChange={(e) => onUpdate(zone.id, { crowd_density: Number(e.target.value) })}
        className="w-full accent-primary"
      />
    </div>
  );
}

/* ─── SOS Alert Card ──────────────────────────────────── */
function SosCard({ alert, onResolve }) {
  const isResolved = alert.status === 'resolved';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border p-4 ${isResolved ? 'border-white/5 bg-white/[0.03] opacity-60' : 'border-danger/30 bg-danger/10 shadow-[0_0_20px_rgba(239,68,68,0.1)]'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-white truncate">{alert.user_name || 'Unknown user'}</p>
          <p className="mt-0.5 text-xs text-white/50">{timeAgo(alert.created_at)}</p>
          {alert.message && <p className="mt-1.5 text-sm text-white/80">{alert.message}</p>}
          {alert.location?.latitude && (
            <p className="mt-1 text-[11px] text-white/40">📍 {Number(alert.location.latitude).toFixed(4)}, {Number(alert.location.longitude).toFixed(4)}</p>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${isResolved ? 'bg-white/10 text-white/40' : 'bg-danger/20 text-danger'}`}>
          {alert.status}
        </span>
      </div>
      {!isResolved && (
        <div className="mt-3 flex gap-2">
          <button onClick={() => onResolve(alert.id)} className="flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white hover:bg-success/90 transition-colors shadow-lg shadow-success/20">
            <CheckCircle2 size={13} /> Resolve
          </button>
          {alert.location?.latitude && (
            <a href={`https://maps.google.com/?q=${alert.location.latitude},${alert.location.longitude}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors">
              🗺️ View map
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Empty state ─────────────────────────────────────── */
function Empty({ icon: Icon = Inbox, text }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
        <Icon size={20} className="text-white/30" />
      </div>
      <p className="text-sm font-medium text-white/40">{text}</p>
    </div>
  );
}

/* ─── Loading Skeleton ────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-white/5" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-2xl bg-white/5" />
        <div className="h-72 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────── */
export default function AdminDashboard() {
  const { activeEvent, profile } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const eventId = activeEvent?.id;

  // Real-time subscriptions via useTable hook
  const { rows: zones, loading: zonesLoading, reload: reloadZones } = useTable('zones', eventId ? { eq: ['event_id', eventId] } : null);
  const { rows: orders, loading: ordersLoading } = useTable('orders');
  const { rows: sosAlerts, loading: sosLoading, reload: reloadSos } = useTable('sos_requests', eventId ? { eq: ['event_id', eventId] } : null);
  const { rows: vendors, loading: vendorsLoading } = useTable('vendors', eventId ? { eq: ['event_id', eventId] } : null);
  const { rows: participants, loading: participantsLoading } = useTable('participants', eventId ? { eq: ['event_id', eventId] } : null);

  const isLoading = zonesLoading || ordersLoading || sosLoading || vendorsLoading || participantsLoading;

  const activeSos = sosAlerts.filter((a) => a.status !== 'resolved');
  const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');

  const [notifForm, setNotifForm] = useState({ message: '', targetRole: '' });
  const [notifBusy, setNotifBusy] = useState(false);
  const [activeTab, setActiveTab] = useState('zones'); // 'zones' | 'participants' | 'vendors'

  async function handleZoneUpdate(zoneId, patch) {
    const { error } = await supabase.from('zones').update(patch).eq('id', zoneId);
    if (error) push(error.message, 'error');
    else reloadZones();
  }

  async function handleSosResolve(alertId) {
    const { error } = await supabase
      .from('sos_requests')
      .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: profile?.id })
      .eq('id', alertId);
    if (error) push(error.message, 'error');
    else { push('SOS resolved ✓', 'success'); reloadSos(); }
  }

  async function handleSendNotification(e) {
    e.preventDefault();
    if (!eventId || !notifForm.message.trim()) return;
    setNotifBusy(true);
    const { error } = await supabase.from('notifications').insert({
      event_id: eventId,
      message: notifForm.message,
      target_role: notifForm.targetRole || null,
    });
    setNotifBusy(false);
    if (error) push(error.message, 'error');
    else { push('Notification sent!', 'success'); setNotifForm({ message: '', targetRole: '' }); }
  }

  if (isLoading) return <PageTransition className="space-y-6"><Skeleton /></PageTransition>;

  return (
    <PageTransition className="space-y-8 pb-10" role="main" aria-label="Admin dashboard">

      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-black/40 p-6 backdrop-blur-xl shadow-xl shadow-black/30"
      >
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-[80px]" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Radio size={18} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Admin War Room</span>
            </div>
            <h1 className="font-heading text-4xl font-extrabold text-white">{activeEvent?.name || 'Event Dashboard'}</h1>
            {activeEvent?.event_code && (
              <div className="mt-3 inline-flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 backdrop-blur">
                <span className="text-xs text-white/50">Event Code</span>
                <span className="font-mono font-black tracking-[0.25em] text-primary">{activeEvent.event_code}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/admin/schedule')}
              className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-bold text-accent hover:bg-accent/20 transition-colors"
            >
              <Calendar size={15} /> Schedule
            </button>
            <button
              onClick={() => navigate('/admin/stalls')}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/70 hover:bg-white/10 transition-colors"
            >
              <Store size={15} /> Stalls
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Participants" value={participants.length} icon={Users}       tone="primary"  delay={0}    onClick={() => setActiveTab('participants')} />
        <StatCard label="Vendors"      value={vendors.length}      icon={Store}       tone="accent"   delay={0.07} onClick={() => setActiveTab('vendors')} />
        <StatCard label="Active SOS"   value={activeSos.length}    icon={Shield}      tone="danger"   delay={0.14} />
        <StatCard label="Live Orders"  value={activeOrders.length} icon={ShoppingBag} tone="warning"  delay={0.21} />
      </div>

      {/* ── LIVE INDICATOR ── */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-success">Live · Real-time Supabase subscription active</span>
      </div>

      {/* ── TWO COL: CROWD + SOS ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Live Crowd Map" icon={MapPin} delay={0.1}>
          <CrowdMap zones={zones} event={activeEvent} readOnly={false}
            onZoneClick={(zone) => {
              const d = Number(window.prompt(`Density for "${zone.name}" (0-100):`, zone.crowd_density));
              if (!isNaN(d)) handleZoneUpdate(zone.id, { crowd_density: Math.min(100, Math.max(0, d)) });
            }}
          />
          <div className="mt-4 space-y-3">
            {zones.length ? zones.map((z) => <ZoneCard key={z.id} zone={z} onUpdate={handleZoneUpdate} />) : <Empty icon={MapPin} text="No zones provisioned for this event." />}
          </div>
        </Panel>

        <Panel title="SOS Dashboard" icon={Shield} badge={activeSos.length > 0 ? activeSos.length : undefined} delay={0.15}>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {sosAlerts.length ? (
                sosAlerts.slice(0, 8).map((a) => <SosCard key={a.id} alert={a} onResolve={handleSosResolve} />)
              ) : (
                <Empty icon={Shield} text="All clear — no emergency requests." />
              )}
            </AnimatePresence>
          </div>
        </Panel>
      </div>

      {/* ── TAB SECTION: Participants / Vendors ── */}
      <Panel title="People" icon={Users} delay={0.2} actions={
        <div className="flex rounded-xl bg-white/5 p-1">
          {['participants', 'vendors'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold capitalize transition-all ${activeTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-white/50 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      }>
        <AnimatePresence mode="wait">
          {activeTab === 'participants' ? (
            <motion.div key="participants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-3 sm:grid-cols-2">
              {participants.length ? participants.map((p) => (
                <div key={p.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-4 hover:bg-white/[0.05] transition backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-sm font-black text-primary">
                        {(p.full_name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{p.full_name}</p>
                        <p className="text-xs text-white/40">{p.email}</p>
                      </div>
                    </div>
                    {p.seat_number && (
                      <div className="shrink-0 rounded-lg border border-accent/20 bg-accent/10 px-2.5 py-1 text-center">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-accent">Seat</p>
                        <p className="text-lg font-black text-white leading-none">{p.seat_number}</p>
                      </div>
                    )}
                  </div>
                </div>
              )) : <Empty icon={Users} text="No participants joined yet." />}
            </motion.div>
          ) : (
            <motion.div key="vendors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-3 sm:grid-cols-2">
              {vendors.length ? vendors.map((v) => (
                <div key={v.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-4 hover:bg-white/[0.05] transition">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/20 text-sm font-black text-warning">
                      {(v.vendor_name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{v.vendor_name}</p>
                      <p className="text-xs text-white/40">{v.owner_name} · {v.service_type}</p>
                      <p className="text-xs text-white/30">{v.stall_name || 'Stall pending'}</p>
                    </div>
                  </div>
                </div>
              )) : <Empty icon={Store} text="No vendors joined yet." />}
            </motion.div>
          )}
        </AnimatePresence>
      </Panel>

      {/* ── BROADCAST + ORDERS ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Broadcast Notification" icon={Bell} delay={0.25}>
          <form className="space-y-4" onSubmit={handleSendNotification}>
            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-white/40">Message</label>
              <textarea
                className="min-h-28 w-full resize-none rounded-xl border border-white/10 bg-black/40 p-4 text-sm placeholder-white/20 focus:border-primary transition-colors backdrop-blur"
                placeholder="Main stage event starts in 10 minutes..."
                value={notifForm.message}
                onChange={(e) => setNotifForm((cur) => ({ ...cur, message: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-white/40">Target Audience</label>
              <select
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm focus:border-primary transition-colors"
                value={notifForm.targetRole}
                onChange={(e) => setNotifForm((cur) => ({ ...cur, targetRole: e.target.value }))}
              >
                <option value="">All roles</option>
                <option value="participant">Participants only</option>
                <option value="vendor">Vendors only</option>
                <option value="admin">Admins only</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={notifBusy}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50 transition shadow-lg shadow-primary/20"
            >
              {notifBusy ? 'Sending...' : 'Send Notification →'}
            </button>
          </form>
        </Panel>

        <Panel title="Live Orders" icon={ShoppingBag} badge={activeOrders.length > 0 ? activeOrders.length : undefined} delay={0.3}>
          <div className="grid gap-3 sm:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {activeOrders.length ? activeOrders.slice(0, 8).map((order) => (
                <motion.div
                  layout
                  key={order.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border border-white/5 bg-white/[0.03] p-3 hover:bg-white/[0.05] transition"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-white">#{order.id.slice(0, 6)}</p>
                    <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold text-warning">{order.status}</span>
                  </div>
                  <p className="text-xs text-white/40">₹{Number(order.total_price || 0).toFixed(2)}</p>
                </motion.div>
              )) : <div className="col-span-2"><Empty icon={ShoppingBag} text="No active orders." /></div>}
            </AnimatePresence>
          </div>
        </Panel>
      </div>

      {/* ── CHATBOT ── */}
      <ChatbotButton
        role="admin"
        contextData={{ participants, vendors, sos: sosAlerts, orders, zones, notifications: [] }}
        event={activeEvent}
      />
    </PageTransition>
  );
}
