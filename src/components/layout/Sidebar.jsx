import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart2, Bell, ChevronRight, ClipboardList,
  Home, LayoutDashboard, LogOut, MapPin, Radio,
  Shield, ShoppingBag, Store, Ticket, Users
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/auth.service';

const adminLinks = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/crowd', label: 'Crowd Monitor', icon: MapPin },
  { to: '/admin/sos', label: 'SOS Alerts', icon: Shield },
  { to: '/admin/stalls', label: 'Stall Management', icon: Store },
  { to: '/admin/participants', label: 'Participants', icon: Users },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 }
];

const participantLinks = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/qr-pass', label: 'My QR Pass', icon: Ticket },
  { to: '/food', label: 'Food Menu', icon: ShoppingBag },
  { to: '/orders', label: 'My Orders', icon: ClipboardList },
  { to: '/zones', label: 'Zone Map', icon: MapPin }
];

const vendorLinks = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/stall', label: 'My Stall', icon: Store },
  { to: '/orders', label: 'Live Orders', icon: ClipboardList },
  { to: '/notifications-list', label: 'Announcements', icon: Bell }
];

export default function Sidebar() {
  const { profile, activeEvent } = useAuth();
  const location = useLocation();

  let links = participantLinks;
  if (profile?.role === 'admin') links = adminLinks;
  if (profile?.role === 'vendor') links = vendorLinks;

  async function handleLogout() {
    try { await logout(); } catch { /* noop */ }
  }

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-[#374151] bg-[#0B1220] md:flex shadow-2xl">
      {/* Brand */}
      <div className="border-b border-[#374151] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Radio size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-base font-extrabold text-white tracking-tight">SmartVenueX</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{profile?.role || 'Guest'}</p>
          </div>
        </div>
        {activeEvent ? (
          <div className="mt-5 rounded-xl border border-[#374151] bg-[#111827] p-3 shadow-inner">
            <p className="truncate text-xs font-semibold text-[#E5E7EB]">{activeEvent.name}</p>
            <p className="mt-1 font-mono text-[10px] font-bold tracking-[0.2em] text-primary">
              {activeEvent.event_code}
            </p>
          </div>
        ) : null}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to || (to === '/dashboard' && location.pathname === '/');
          return (
            <NavLink
              key={to}
              to={to}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-all z-10 ${
                isActive
                  ? 'text-primary'
                  : 'text-[#9CA3AF] hover:bg-[#111827] hover:text-[#E5E7EB]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={18} className={`relative z-10 transition-colors ${isActive ? 'text-primary' : ''}`} />
              <span className="flex-1 relative z-10">{label}</span>
              {isActive && <ChevronRight size={14} className="opacity-100 text-primary relative z-10" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="border-t border-[#374151] p-5 bg-[#0B1220]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent border border-white/10 text-xs font-bold text-white shadow-lg">
            {(profile?.full_name || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-bold text-[#E5E7EB]">{profile?.full_name || 'User'}</p>
            <p className="truncate text-[10px] font-medium text-[#9CA3AF]">{profile?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center rounded-lg p-2 text-[#9CA3AF] hover:bg-[#111827] hover:text-[#E5E7EB] transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
