/**
 * RoleSelectionPage.jsx
 * Step 1 of onboarding: choose Admin, Participant, or Vendor.
 * Premium card layout with color-coded roles and hover effects.
 */
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Shield, Store, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { setUserRole } from '../../services/auth.service';

const roles = [
  {
    key: 'admin',
    title: 'Admin',
    emoji: '🛡️',
    description: 'Create the event, manage stalls and zones, and run the control room.',
    icon: Shield,
    perks: ['Create & manage events', 'Unique event code generation', 'Crowd & SOS control'],
    color: 'border-primary/30 hover:border-primary/60',
    iconBg: 'bg-primary/20 text-primary',
    glow: 'hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]',
    badge: 'bg-primary/10 text-primary border-primary/20',
  },
  {
    key: 'participant',
    title: 'Participant',
    emoji: '🎓',
    description: 'Join with an event code, get a QR pass, order food, and receive live updates.',
    icon: Users,
    perks: ['QR-based event pass', 'Live food ordering', 'Real-time schedule'],
    color: 'border-accent/30 hover:border-accent/60',
    iconBg: 'bg-accent/20 text-accent',
    glow: 'hover:shadow-[0_0_40px_rgba(34,211,238,0.12)]',
    badge: 'bg-accent/10 text-accent border-accent/20',
  },
  {
    key: 'vendor',
    title: 'Stall Owner',
    emoji: '🏪',
    description: 'Join with the event code, get assigned a stall, and manage live orders.',
    icon: Store,
    perks: ['Stall assignment & profile', 'Live order management', 'Announcement dashboard'],
    color: 'border-warning/30 hover:border-warning/60',
    iconBg: 'bg-warning/20 text-warning',
    glow: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.12)]',
    badge: 'bg-warning/10 text-warning border-warning/20',
  },
];

export default function RoleSelectionPage() {
  const { user, profile, loading, refresh } = useAuth();
  const [busyRole, setBusyRole] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!loading && !user) return <Navigate to="/login" replace />;
  if (profile?.role && !profile?.onboarding_completed) return <Navigate to={`/onboarding/${profile.role}`} replace />;
  if (profile?.role && profile?.onboarding_completed) return <Navigate to="/dashboard" replace />;

  async function handleSelect(roleKey) {
    setBusyRole(roleKey);
    setError('');
    try {
      await setUserRole(roleKey);
      await refresh();
      navigate(`/onboarding/${roleKey}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to save role');
    } finally {
      setBusyRole('');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16 bg-gradient-to-b from-[#0B1220] to-[#111827]">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden mix-blend-screen">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Step 1 of 2</p>
          <h1 className="font-heading text-5xl font-extrabold text-white">Choose your role</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/50">
            We'll adapt the entire experience to your role. This cannot be changed after onboarding.
          </p>
        </motion.div>

        {error && (
          <p className="mb-6 rounded-2xl border border-danger/20 bg-danger/10 px-5 py-3.5 text-sm text-danger text-center">
            {error}
          </p>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          {roles.map((role, i) => {
            const Icon = role.icon;
            const isBusy = busyRole === role.key;
            const isDisabled = Boolean(busyRole);
            return (
              <motion.button
                key={role.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                whileHover={!isDisabled ? { y: -6 } : {}}
                onClick={() => handleSelect(role.key)}
                disabled={isDisabled}
                className={`group relative overflow-hidden rounded-3xl border bg-[#111827]/80 p-6 text-left backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all duration-300 disabled:opacity-50 ${role.color} ${role.glow}`}
              >
                {/* Decorative inner glow */}
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#3B82F6]/10 blur-2xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="mb-5 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${role.badge}`}>
                      {role.emoji} {role.title}
                    </span>
                    {isBusy ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#E5E7EB]/20 border-t-[#E5E7EB]" />
                    ) : (
                      <ArrowRight size={16} className="text-[#9CA3AF] transition-transform group-hover:translate-x-1 group-hover:text-[#E5E7EB]" />
                    )}
                  </div>

                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${role.iconBg}`}>
                    <Icon size={22} />
                  </div>

                  <h2 className="font-heading text-2xl font-bold text-[#E5E7EB]">{role.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">{role.description}</p>

                  <ul className="mt-5 space-y-2.5">
                    {role.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2.5 text-xs text-[#9CA3AF]">
                        <CheckCircle2 size={13} className="shrink-0 text-primary" />
                        {perk}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 rounded-xl bg-[#374151]/30 py-2.5 text-center text-xs font-bold text-[#E5E7EB] transition-colors group-hover:bg-primary group-hover:text-white">
                    {isBusy ? 'Setting up...' : `Continue as ${role.title} →`}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
