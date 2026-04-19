import { NavLink, useLocation } from 'react-router-dom';
import { Bell, Home, MapPin, ShoppingBag, Ticket, ClipboardList, Store } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';

const participantLinks = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/zones', label: 'Zones', icon: MapPin },
  { to: '/food', label: 'Food', icon: ShoppingBag },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/qr-pass', label: 'My Pass', icon: Ticket }
];

const vendorLinks = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/stall', label: 'My Stall', icon: Store },
  { to: '/notifications-list', label: 'Alerts', icon: Bell }
];

export default function BottomNav() {
  const { profile } = useAuth();
  const location = useLocation();
  const links = profile?.role === 'vendor' ? vendorLinks : participantLinks;

  return (
    <nav
      className='fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t border-[#374151] bg-[#0B1220]/90 backdrop-blur-2xl md:hidden pb-safe shadow-[0_-10px_40px_rgba(11,18,32,0.8)]'
      role='navigation'
      aria-label='Main navigation'
    >
      {links.map(({ to, label, icon: Icon }) => {
        const isActive = location.pathname === to || (to === '/dashboard' && location.pathname === '/');
        return (
          <NavLink
            key={to}
            to={to}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1.5 py-3.5 text-[10px] font-bold uppercase tracking-wider transition-colors z-10 ${
              isActive ? 'text-primary' : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="bottom-nav-active"
                className="absolute inset-0 bg-primary/10 border-t-2 border-primary"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} className={`relative z-10 ${isActive ? 'text-primary' : ''}`} />
            <span className="relative z-10">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
