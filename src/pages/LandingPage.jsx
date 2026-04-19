/**
 * LandingPage.jsx
 * Public-facing landing page for SmartVenueX.
 * Shows hero, features, how-it-works, and CTA with a premium SaaS aesthetic.
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, BarChart2, Bell, Calendar, MapPin, QrCode,
  Radio, Shield, ShoppingBag, Sparkles, Store, Users, Zap
} from 'lucide-react';

/* ─── animation helpers ──────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.4, 0, 1] },
});

/* ─── Feature grid data ───────────────────── */
const features = [
  {
    icon: Calendar,
    title: 'Event Management',
    desc: 'Create events in minutes. Generate unique codes, set stall capacities, and manage everything from one war room.',
    tone: 'primary',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    desc: 'Admin, Participant, and Stall Owner roles — each with a tailored dashboard and permissions.',
    tone: 'accent',
  },
  {
    icon: QrCode,
    title: 'Smart QR Passes',
    desc: 'Every participant receives a unique QR pass with seat number, WiFi credentials, and helpline info.',
    tone: 'success',
  },
  {
    icon: BarChart2,
    title: 'Live Crowd Tracking',
    desc: 'Real-time zone density overlays on interactive maps. Know exactly where the crowd is heading.',
    tone: 'warning',
  },
  {
    icon: ShoppingBag,
    title: 'Food & Order System',
    desc: 'Browse stall menus, place orders, and track them in real-time — all without leaving the dashboard.',
    tone: 'primary',
  },
  {
    icon: Shield,
    title: 'SOS Emergency System',
    desc: 'Participants can send geo-tagged SOS alerts to admins instantly. Safety is built in, not bolted on.',
    tone: 'danger',
  },
];

const toneMap = {
  primary: { icon: 'bg-primary/20 text-primary', glow: 'shadow-[0_0_25px_rgba(139,92,246,0.2)]', border: 'border-primary/20' },
  accent: { icon: 'bg-accent/20 text-accent', glow: 'shadow-[0_0_25px_rgba(34,211,238,0.2)]', border: 'border-accent/20' },
  success: { icon: 'bg-success/20 text-success', glow: 'shadow-[0_0_25px_rgba(16,185,129,0.15)]', border: 'border-success/20' },
  warning: { icon: 'bg-warning/20 text-warning', glow: 'shadow-[0_0_25px_rgba(245,158,11,0.15)]', border: 'border-warning/20' },
  danger: { icon: 'bg-danger/20 text-danger', glow: 'shadow-[0_0_25px_rgba(239,68,68,0.15)]', border: 'border-danger/20' },
};

/* ─── How it works ────────────────────────── */
const steps = [
  { num: '01', title: 'Admin creates event', desc: 'Fill in details, get a unique code, stalls auto-provisioned.' },
  { num: '02', title: 'Share the code', desc: 'Participants and stall owners join using the code from any device.' },
  { num: '03', title: 'Go live instantly', desc: 'Real-time dashboards, QR passes, order systems, and crowd maps activate automatically.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      
      {/* ════════ NAVBAR ════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/40 px-6 py-4 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.4)]">
              <Radio size={16} className="text-primary" />
            </div>
            <span className="font-heading text-base font-extrabold text-white tracking-tight">SmartVenueX</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white/70 transition hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/login"
              className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:bg-primary-hover hover:shadow-primary/50"
            >
              Get started →
            </Link>
          </div>
        </div>
      </nav>

      {/* ════════ HERO ════════ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20 pb-16 text-center">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[120px]" />
          <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-accent/10 blur-[100px]" />
        </div>

        <motion.div {...fadeUp(0)} className="relative z-10 max-w-4xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary backdrop-blur shadow-[0_0_20px_rgba(139,92,246,0.2)]">
            <Sparkles size={14} />
            Smart Event Management Platform
          </div>

          <h1 className="font-heading text-5xl font-black leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            Run Your Events Like a{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Control Room
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60 leading-relaxed">
            SmartVenueX gives admins, participants, and stall owners their own live dashboard — with real-time crowd maps, QR passes, food ordering, and SOS alerts. All in one platform.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              className="group flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-white shadow-2xl shadow-primary/40 transition hover:bg-primary-hover hover:shadow-primary/60 hover:scale-105"
            >
              Get Started Free
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              <Zap size={16} className="text-warning" /> Demo Login
            </Link>
          </div>
        </motion.div>

        {/* Hero stat bar */}
        <motion.div
          {...fadeUp(0.3)}
          className="relative z-10 mt-16 flex flex-wrap items-center justify-center gap-8 rounded-2xl border border-white/5 bg-white/[0.03] px-10 py-6 backdrop-blur-xl"
        >
          {[
            { label: 'Events Managed', value: '200+' },
            { label: 'Participants Tracked', value: '50K+' },
            { label: 'Real-time Updates', value: '<100ms' },
            { label: 'Roles Supported', value: '3' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-heading text-3xl font-black text-white">{stat.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/40">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ════════ FEATURES ════════ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp()} className="mb-16 text-center">
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-primary">Everything you need</p>
            <h2 className="font-heading text-4xl font-extrabold text-white lg:text-5xl">Built for live events</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/50">
              Every feature works in real-time. No page refreshes, no polling — pure Supabase Realtime channels.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const tone = toneMap[f.tone];
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  {...fadeUp(i * 0.08)}
                  className={`group overflow-hidden rounded-2xl border ${tone.border} bg-white/[0.03] p-6 backdrop-blur-md transition-all hover:bg-white/[0.06] hover:${tone.glow}`}
                >
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${tone.icon}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════ HOW IT WORKS ════════ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div {...fadeUp()} className="mb-16 text-center">
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-accent">Simple process</p>
            <h2 className="font-heading text-4xl font-extrabold text-white">Up and running in 3 steps</h2>
          </motion.div>

          <div className="relative space-y-8">
            {/* Connecting line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary via-accent to-transparent md:left-8" />
            {steps.map((step, i) => (
              <motion.div key={step.num} {...fadeUp(i * 0.15)} className="relative flex gap-6 md:gap-8">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0A0E17] border border-white/10 font-heading text-sm font-black text-primary shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                  {step.num}
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 flex-1 backdrop-blur">
                  <h3 className="font-heading text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-white/50">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ ROLES PREVIEW ════════ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp()} className="mb-16 text-center">
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-success">Tailored dashboards</p>
            <h2 className="font-heading text-4xl font-extrabold text-white">One platform, three perspectives</h2>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Shield,
                role: 'Admin',
                badge: 'bg-primary/20 text-primary border-primary/30',
                color: 'border-primary/20 shadow-[0_0_30px_rgba(139,92,246,0.1)]',
                items: ['Create & manage events', 'Live crowd zone control', 'SOS alert resolution', 'Broadcast notifications', 'Vendor & stall overview'],
              },
              {
                icon: Users,
                role: 'Participant',
                badge: 'bg-accent/20 text-accent border-accent/30',
                color: 'border-accent/20 shadow-[0_0_30px_rgba(34,211,238,0.1)]',
                items: ['Join event with code', 'Unique QR event pass', 'Real-time schedule', 'Food ordering system', 'SOS emergency alerts'],
              },
              {
                icon: Store,
                role: 'Stall Owner',
                badge: 'bg-warning/20 text-warning border-warning/30',
                color: 'border-warning/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]',
                items: ['Join with event code', 'Assigned stall details', 'Live order management', 'Status updates in-app', 'Event announcements'],
              },
            ].map((roleInfo, i) => {
              const Icon = roleInfo.icon;
              return (
                <motion.div
                  key={roleInfo.role}
                  {...fadeUp(i * 0.1)}
                  className={`rounded-2xl border bg-white/[0.03] p-6 backdrop-blur ${roleInfo.color}`}
                >
                  <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${roleInfo.badge}`}>
                    <Icon size={13} /> {roleInfo.role}
                  </div>
                  <ul className="space-y-3">
                    {roleInfo.items.map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                        <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════ CTA ════════ */}
      <section className="px-6 py-24">
        <motion.div
          {...fadeUp()}
          className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-primary/20 via-[#0A0E17] to-accent/10 p-12 text-center shadow-2xl backdrop-blur-xl"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
          </div>
          <div className="relative z-10">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 shadow-[0_0_30px_rgba(139,92,246,0.4)]">
              <Radio size={28} className="text-primary" />
            </div>
            <h2 className="font-heading text-4xl font-extrabold text-white">Ready to run your event smarter?</h2>
            <p className="mx-auto mt-4 max-w-md text-white/50">Get started in under 2 minutes. No credit card. No setup. Just smart event management.</p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                to="/login"
                className="group flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-white shadow-xl shadow-primary/40 transition hover:scale-105 hover:shadow-primary/60"
              >
                Create Your First Event
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/login"
                className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Try the Demo
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="border-t border-white/5 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Radio size={14} className="text-primary" />
          <span className="font-heading text-sm font-bold text-white">SmartVenueX</span>
        </div>
        <p className="text-xs text-white/30">Smart Event Management Platform · Built with React & Supabase</p>
      </footer>
    </div>
  );
}
