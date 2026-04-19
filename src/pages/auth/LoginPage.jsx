/**
 * LoginPage.jsx — PromptWars Premium Split-Screen Auth
 *
 * LEFT:  Brand panel — PromptWars identity, tagline, feature pills, animated glow
 * RIGHT: Glassmorphism card — email/password form, quick demo role buttons,
 *        loading states, error handling + smooth Framer Motion transitions.
 */
import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  QrCode,
  Radio,
  Shield,
  ShoppingBag,
  UserRound,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { signInEmail, signUpEmail } from '../../services/auth.service';
import { supabase } from '../../config/supabase';

/* ─── Quick demo accounts ──────────────────────────────────────────── */
const QUICK_LOGINS = [
  {
    role: 'Admin',
    emoji: '🛡️',
    email: 'linuxmintpc1@gmail.com',
    password: '000000',
    description: 'Full control room access',
    gradient: 'from-[#3B82F6]/30 via-[#3B82F6]/10 to-transparent',
    border: 'border-[#3B82F6]/40',
    badgeColor: 'bg-[#3B82F6]/20 text-[#3B82F6]',
    hoverGlow: 'hover:shadow-[0_0_24px_rgba(59,130,246,0.25)]',
  },
  {
    role: 'Participant',
    emoji: '🎓',
    email: 'participant@smartvenue.test',
    password: 'demo1234',
    description: 'Browse events & get your pass',
    gradient: 'from-[#22D3EE]/30 via-[#22D3EE]/10 to-transparent',
    border: 'border-[#22D3EE]/40',
    badgeColor: 'bg-[#22D3EE]/20 text-[#22D3EE]',
    hoverGlow: 'hover:shadow-[0_0_24px_rgba(34,211,238,0.2)]',
  },
  {
    role: 'Vendor',
    emoji: '🏪',
    email: 'vendor@smartvenue.test',
    password: 'demo1234',
    description: 'Manage stall & live orders',
    gradient: 'from-[#F59E0B]/30 via-[#F59E0B]/10 to-transparent',
    border: 'border-[#F59E0B]/40',
    badgeColor: 'bg-[#F59E0B]/20 text-[#F59E0B]',
    hoverGlow: 'hover:shadow-[0_0_24px_rgba(245,158,11,0.2)]',
  },
];

/* ─── Left-panel feature highlights ──────────────────────────────── */
const FEATURES = [
  { icon: Calendar, label: 'Real-time event management' },
  { icon: Users, label: 'Role-based access control' },
  { icon: MapPin, label: 'Live crowd density tracking' },
  { icon: QrCode, label: 'Instant QR pass generation' },
  { icon: ShoppingBag, label: 'In-venue food ordering' },
  { icon: Shield, label: 'Built-in SOS emergency system' },
];

/* ─── Reusable Input Field ────────────────────────────────────────── */
function Field({ label, icon: Icon, type = 'text', placeholder, value, onChange, required, minLength, error }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-[#9CA3AF]">{label}</label>
      <div
        className={`group flex items-center gap-3 rounded-xl border bg-[#0B1220]/60 px-4 py-3.5 transition-all duration-200
          ${error
            ? 'border-red-500/50 ring-1 ring-red-500/20'
            : 'border-[#374151] focus-within:border-[#3B82F6]/60 focus-within:ring-1 focus-within:ring-[#3B82F6]/20 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.1)]'
          }`}
      >
        <Icon size={16} className="shrink-0 text-[#9CA3AF] group-focus-within:text-[#3B82F6] transition-colors" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          className="w-full bg-transparent text-sm text-[#E5E7EB] placeholder-[#9CA3AF]/50 outline-none"
        />
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="text-xs font-medium text-red-400">{error}</motion.p>
      )}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */
export default function LoginPage() {
  const { user, profile } = useAuth();
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [quickBusy, setQuickBusy] = useState(null);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  /* Redirects */
  if (user) {
    if (!profile?.role) return <Navigate to="/role-select" replace />;
    if (!profile?.onboarding_completed) return <Navigate to={`/onboarding/${profile.role}`} replace />;
    return <Navigate to="/dashboard" replace />;
  }

  /* Validation */
  function validate() {
    const e = {};
    if (mode === 'signup' && !form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleQuickLogin(acc) {
    setQuickBusy(acc.role);
    setFormError('');
    try { await signInEmail(acc.email, acc.password); }
    catch (err) { setFormError(`${acc.role} demo failed: ${err.message}`); }
    finally { setQuickBusy(null); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true); setFormError(''); setNotice('');
    try {
      if (mode === 'signin') {
        await signInEmail(form.email, form.password);
      } else {
        const data = await signUpEmail({ email: form.email, password: form.password, fullName: form.fullName });
        if (!data.session) setNotice('Account created! Check your email to confirm, then sign in.');
      }
    } catch (err) {
      setFormError(err.message || 'Authentication failed. Please try again.');
    } finally { setBusy(false); }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setBusy(true); setFormError('');
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) throw err;
      setForgotSent(true);
    } catch (err) {
      setFormError(err.message || 'Unable to send reset email');
    } finally { setBusy(false); }
  }

  /* ── Forgot Password Screen ── */
  if (showForgot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1220] p-4 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#3B82F6]/15 blur-[130px]" />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md rounded-2xl border border-[#374151] bg-[#111827]/90 p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[#3B82F6]/20 flex items-center justify-center"><KeyRound size={18} className="text-[#3B82F6]" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#3B82F6]">Account Recovery</p>
              <h1 className="text-lg font-extrabold text-[#E5E7EB]">Reset Password</h1>
            </div>
          </div>
          {forgotSent ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
              ✅ Reset link sent to <strong>{forgotEmail}</strong>. Check your inbox.
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleForgot}>
              <Field label="Email Address" icon={Mail} type="email" placeholder="you@example.com"
                value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
              {formError && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{formError}</p>}
              <button type="submit" disabled={busy}
                className="w-full rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] py-3.5 text-sm font-bold text-white hover:-translate-y-0.5 transition-all shadow-[0_8px_20px_rgba(59,130,246,0.3)] disabled:opacity-60">
                {busy ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}
          <button type="button" onClick={() => { setShowForgot(false); setForgotSent(false); setFormError(''); }}
            className="mt-5 block text-sm text-[#9CA3AF] hover:text-[#E5E7EB] transition-colors">← Back to sign in</button>
        </motion.div>
      </div>
    );
  }

  /* ── Main Split-Screen View ── */
  return (
    <div className="flex min-h-screen bg-[#0B1220] overflow-hidden">

      {/* ═══════════════ LEFT — Brand Panel ═══════════════ */}
      <div className="relative hidden lg:flex lg:w-[52%] flex-col justify-between p-12 xl:p-16 overflow-hidden border-r border-[#374151]/50">
        {/* Layered glow orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[#3B82F6]/20 blur-[140px]" />
          <div className="absolute bottom-0 right-0 h-[350px] w-[350px] rounded-full bg-[#22D3EE]/10 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 h-[200px] w-[200px] rounded-full bg-[#3B82F6]/10 blur-[80px] -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Subtle grid texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)' }} />

        {/* Logo */}
        <Link to="/" className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#3B82F6]/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <Radio size={20} className="text-[#3B82F6]" />
          </div>
          <span className="text-lg font-extrabold text-[#E5E7EB] tracking-tight">PromptWars</span>
        </Link>

        {/* Hero text */}
        <div className="relative z-10 space-y-8">
          <div>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-xs font-bold uppercase tracking-[0.2em] text-[#3B82F6] mb-4">
              Smart Event Platform
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-4xl xl:text-5xl font-extrabold text-[#E5E7EB] leading-[1.12] tracking-tight">
              Create, Manage &{' '}
              <span className="bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] bg-clip-text text-transparent">
                Experience
              </span>{' '}
              Smart Events
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-4 text-[#9CA3AF] leading-relaxed text-sm xl:text-base max-w-md">
              Admins create events and generate unique codes. Participants and stall owners join instantly — no setup needed.
            </motion.p>
          </div>

          {/* How it works mini-flow */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex items-center gap-3 rounded-2xl border border-[#374151] bg-[#111827]/60 px-5 py-4 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#9CA3AF]">
              <span className="h-6 w-6 rounded-full bg-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] font-bold">1</span>
              Admin creates event
            </div>
            <ArrowRight size={14} className="text-[#374151] shrink-0" />
            <div className="flex items-center gap-2 text-xs font-semibold text-[#9CA3AF]">
              <span className="h-6 w-6 rounded-full bg-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE] font-bold">2</span>
              Gets unique code
            </div>
            <ArrowRight size={14} className="text-[#374151] shrink-0" />
            <div className="flex items-center gap-2 text-xs font-semibold text-[#9CA3AF]">
              <span className="h-6 w-6 rounded-full bg-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] font-bold">3</span>
              Others join instantly
            </div>
          </motion.div>

          {/* Feature list */}
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.label} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.07 }}
                className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg border border-[#374151] bg-[#111827] flex items-center justify-center shrink-0">
                  <f.icon size={13} className="text-[#3B82F6]" />
                </div>
                <span className="text-xs text-[#9CA3AF] font-medium leading-tight">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-[#374151]">© 2026 PromptWars · Built on Supabase</p>
      </div>

      {/* ═══════════════ RIGHT — Auth Panel ═══════════════ */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-12 sm:px-8 relative">
        {/* Mobile background glow */}
        <div className="absolute inset-0 pointer-events-none lg:hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-[#3B82F6]/15 blur-[120px]" />
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-md space-y-5">

          {/* Mobile logo */}
          <div className="flex justify-center lg:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#3B82F6]/20 flex items-center justify-center shadow-[0_0_16px_rgba(59,130,246,0.3)]">
                <Radio size={18} className="text-[#3B82F6]" />
              </div>
              <span className="font-extrabold text-[#E5E7EB] text-lg tracking-tight">PromptWars</span>
            </Link>
          </div>

          {/* Header text */}
          <div className="text-center lg:text-left pb-1">
            <h1 className="text-2xl font-extrabold text-[#E5E7EB] tracking-tight">Welcome back</h1>
            <p className="text-sm text-[#9CA3AF] mt-1">Sign in or create an account to continue</p>
          </div>

          {/* ── Quick Demo Login ── */}
          <div className="rounded-2xl border border-[#374151] bg-[#111827]/80 p-5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} className="text-[#F59E0B]" />
              <p className="text-sm font-bold text-[#E5E7EB]">Try a demo role</p>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]/60">No signup</span>
            </div>
            <div className="space-y-2.5">
              {QUICK_LOGINS.map((acc) => (
                <button key={acc.role} type="button" onClick={() => handleQuickLogin(acc)}
                  disabled={quickBusy !== null}
                  className={`w-full rounded-xl border bg-gradient-to-r ${acc.gradient} ${acc.border} ${acc.hoverGlow} p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-50`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl flex-shrink-0">{acc.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#E5E7EB]">{acc.role}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${acc.badgeColor}`}>{acc.role}</span>
                        </div>
                        <p className="text-[11px] text-[#9CA3AF] mt-0.5">{acc.description}</p>
                      </div>
                    </div>
                    {quickBusy === acc.role
                      ? <div className="h-4 w-4 rounded-full border-2 border-[#E5E7EB]/20 border-t-[#E5E7EB] animate-spin flex-shrink-0" />
                      : <ArrowRight size={14} className="text-[#9CA3AF] flex-shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-[#374151]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]/60">or sign in manually</span>
            <div className="flex-1 border-t border-[#374151]" />
          </div>

          {/* ── Auth Form Card ── */}
          <div className="rounded-2xl border border-[#374151] bg-[#111827]/80 p-6 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_40px_rgba(0,0,0,0.4)]">
            {/* Sign In / Sign Up toggle */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#0B1220]/60 p-1 mb-6">
              {['signin', 'signup'].map((m) => (
                <button key={m} type="button"
                  onClick={() => { setMode(m); setFieldErrors({}); setFormError(''); setNotice(''); }}
                  className={`rounded-lg py-2.5 text-xs font-bold transition-all duration-200
                    ${mode === m
                      ? 'bg-[#3B82F6] text-white shadow-[0_4px_12px_rgba(59,130,246,0.4)]'
                      : 'text-[#9CA3AF] hover:text-[#E5E7EB]'}`}>
                  {m === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div key="fullname"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}>
                    <Field label="Full Name" icon={UserRound} placeholder="Alex Carter"
                      value={form.fullName} onChange={(e) => setForm((c) => ({ ...c, fullName: e.target.value }))}
                      error={fieldErrors.fullName} required />
                  </motion.div>
                )}
              </AnimatePresence>

              <Field label="Email Address" icon={Mail} type="email" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                error={fieldErrors.email} required />

              <Field label="Password" icon={Lock} type="password" placeholder="••••••••"
                value={form.password} onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                error={fieldErrors.password} required minLength={6} />

              {mode === 'signin' && (
                <div className="text-right -mt-1">
                  <button type="button" onClick={() => setShowForgot(true)}
                    className="text-xs font-semibold text-[#3B82F6] hover:text-[#22D3EE] transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              {formError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {formError}
                </motion.p>
              )}
              {notice && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                  {notice}
                </motion.p>
              )}

              <button type="submit" disabled={busy}
                className="w-full rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] py-4 text-sm font-bold tracking-wide text-white hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,130,246,0.4)] disabled:opacity-60 transition-all duration-200 mt-2">
                {busy
                  ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Authenticating…</span>
                  : mode === 'signin' ? 'Sign In →' : 'Create Account →'}
              </button>
            </form>
          </div>

          {/* Onboarding explanation for new users */}
          {mode === 'signup' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[#374151] bg-[#111827]/60 px-5 py-4 space-y-2.5 backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">After creating your account:</p>
              {[
                { step: '1', text: 'Choose your role: Admin, Participant, or Vendor' },
                { step: '2', text: 'Admin → Create your event. Others → Enter event code' },
                { step: '3', text: 'Access your personalised dashboard instantly' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <CheckCircle2 size={14} className="text-[#3B82F6] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#9CA3AF]">{text}</p>
                </div>
              ))}
            </motion.div>
          )}

          <p className="text-center text-[11px] text-[#374151]">© 2026 PromptWars · Powered by Supabase Realtime</p>
        </motion.div>
      </div>
    </div>
  );
}
