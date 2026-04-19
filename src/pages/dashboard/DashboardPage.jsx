import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '../../components/common/PageTransition';
import StatCard from '../../components/dashboard/StatCard';
import AdminPanel from '../../components/dashboard/AdminPanel';
import ParticipantPanel from '../../components/dashboard/ParticipantPanel';
import VendorPanel from '../../components/dashboard/VendorPanel';
import ChatbotButton from '../../components/chatbot/ChatbotButton';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchDashboardData,
  subscribeRealtime,
  updateOrderStatus,
  updateZone,
} from '../../services/eventflow.service';

export default function DashboardPage() {
  const { activeEvent, profile, refresh } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    if (!profile?.role) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchDashboardData(profile);
      setDashboard(data);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [profile?.id, profile?.role, profile?.event_id]);

  useEffect(() => {
    if (!profile?.role || !profile?.onboarding_completed) return undefined;
    return subscribeRealtime(profile.role, load);
  }, [profile?.role, profile?.onboarding_completed]);

  const stats = useMemo(() => {
    if (!dashboard) return [];
    if (profile?.role === 'admin') {
      return [
        { label: 'Participants', value: dashboard.participants.length, tone: 'primary' },
        { label: 'Vendors', value: dashboard.vendors.length, tone: 'accent' },
        { label: 'Open SOS', value: dashboard.sos.filter((item) => item.status !== 'resolved').length, tone: 'danger' },
        { label: 'Live Orders', value: dashboard.orders.filter((item) => item.status !== 'completed').length, tone: 'warning' },
      ];
    }
    if (profile?.role === 'participant') {
      return [
        { label: 'Seat No.', value: dashboard.participant?.seat_number ?? '—', tone: 'primary' },
        { label: 'Stalls', value: dashboard.stalls.length, tone: 'accent' },
        { label: 'Crowd Zones', value: dashboard.zones.filter((item) => item.status !== 'closed').length, tone: 'warning' },
      ];
    }
    return [
      { label: 'Assigned Stall', value: dashboard.vendor?.stall_name || 'Pending', tone: 'primary' },
      { label: 'Orders', value: dashboard.orders.length, tone: 'warning' },
      { label: 'Notifications', value: dashboard.notifications.length, tone: 'success' },
    ];
  }, [dashboard, profile?.role]);

  async function handleStatus(orderId, status) {
    setNotice('');
    try {
      await updateOrderStatus(orderId, status);
      await load();
      setNotice(`Order moved to ${status}.`);
    } catch (err) {
      setError(err.message || 'Unable to update order');
    }
  }

  async function handleZoneUpdate(zoneId, patch) {
    try {
      await updateZone(zoneId, patch);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to update zone');
    }
  }

  if (loading) {
    return (
      <PageTransition className="space-y-4">
        <div className="h-20 rounded-2xl bg-white/5 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-36 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-36 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-36 rounded-xl bg-white/5 animate-pulse" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-8 pb-32">
      {/* ── Welcome Header ── */}
      <motion.section
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-[#374151] bg-gradient-to-br from-[#111827] to-[#0B1220] p-6 sm:p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      >
        {/* Glow orb */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#3B82F6]/15 blur-[100px] pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-[#22D3EE]/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10">
          {/* Role badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#3B82F6]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
            {profile?.role} dashboard
          </span>

          {/* Welcome message */}
          <h1 className="mt-3 font-heading text-3xl sm:text-4xl font-extrabold text-[#E5E7EB] tracking-tight">
            {activeEvent?.name
              ? <>{activeEvent.name}</>
              : <>Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋</>}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#9CA3AF] leading-relaxed">
            {activeEvent?.description || (
              profile?.role === 'admin'
                ? 'You have no active event. Create one to get started.'
                : 'You haven\'t joined an event yet. Enter your event code to get started.'
            )}
          </p>

          {/* Action row */}
          <div className="mt-6 flex flex-wrap gap-3 items-center">
            {activeEvent?.event_code && (
              <span className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-4 py-2 text-sm font-bold tracking-[0.2em] text-[#3B82F6]">
                CODE {activeEvent.event_code}
              </span>
            )}
            {activeEvent?.category && (
              <span className="rounded-full border border-[#374151] bg-white/5 px-4 py-2 text-sm font-semibold text-[#9CA3AF]">
                {activeEvent.category}
              </span>
            )}

            {/* Primary CTA */}
            {profile?.role === 'admin' && !activeEvent && (
              <button type="button" onClick={() => navigate('/onboarding/admin')}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-5 py-2.5 text-sm font-bold text-white hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)] transition-all">
                <Plus size={15} /> Create Event
              </button>
            )}
            {profile?.role !== 'admin' && !activeEvent && (
              <button type="button" onClick={() => navigate(`/onboarding/${profile?.role}`)}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#3B82F6] px-5 py-2.5 text-sm font-bold text-white hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(34,211,238,0.3)] transition-all">
                <Zap size={15} /> Join an Event
              </button>
            )}
            {profile?.role === 'admin' && activeEvent && (
              <button type="button" onClick={() => navigate('/admin/schedule')}
                className="flex items-center gap-1.5 rounded-full border border-[#22D3EE]/40 bg-[#22D3EE]/10 px-4 py-2 text-sm font-bold text-[#22D3EE] hover:bg-[#22D3EE]/20 transition-colors">
                <Calendar size={14} strokeWidth={2.5} /> Manage Schedule
              </button>
            )}
          </div>
        </div>
      </motion.section>

      {error ? <p className="rounded-xl border border-danger/30 bg-danger/20 px-5 py-4 text-sm font-medium text-red-100 backdrop-blur-md shadow-lg shadow-danger/10">{error}</p> : null}
      {notice ? <p className="rounded-xl border border-success/30 bg-success/20 px-5 py-4 text-sm font-medium text-green-100 backdrop-blur-md shadow-lg shadow-success/10">{notice}</p> : null}

      {/* Stat cards */}
      <section className={`grid gap-5 ${stats.length > 3 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        {stats.map((stat, i) => (
          <StatCard key={stat.label} delay={i * 0.1} {...stat} />
        ))}
      </section>

      {/* Panels */}
      {profile?.role === 'admin' && (
        <AdminPanel 
          dashboard={dashboard} 
          activeEvent={activeEvent} 
          handleZoneUpdate={handleZoneUpdate} 
          handleStatus={handleStatus} 
          refresh={load}
          setError={setError}
          setNotice={setNotice}
        />
      )}
      
      {profile?.role === 'participant' && (
        <ParticipantPanel 
          dashboard={dashboard} 
          activeEvent={activeEvent} 
          refresh={load}
          setError={setError}
          setNotice={setNotice}
        />
      )}

      {profile?.role === 'vendor' && (
        <VendorPanel 
          dashboard={dashboard} 
          handleStatus={handleStatus} 
        />
      )}

      {/* Chatbot — available for all roles */}
      {dashboard && (
        <ChatbotButton
          role={profile?.role}
          contextData={dashboard}
          event={activeEvent}
        />
      )}
    </PageTransition>
  );
}
