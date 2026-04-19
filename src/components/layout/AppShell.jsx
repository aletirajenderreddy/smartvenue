import { Link } from 'react-router-dom';
import { LogOut, Menu, Radio } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/auth.service';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppShell({ children }) {
  const { activeEvent, profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className='flex min-h-screen bg-[#0B1220]'>
      {/* Desktop sidebar (shared across all roles) */}
      <Sidebar />

      {/* Main content */}
      <div className='flex flex-1 flex-col min-w-0'>
        {/* Top header for mobile */}
        <header className='sticky top-0 z-30 flex items-center justify-between border-b border-[#374151] bg-[#0B1220]/90 px-4 py-3 backdrop-blur-xl md:hidden'>
          <div className='flex items-center gap-2'>
            <div className='flex h-7 w-7 items-center justify-center rounded bg-primary/20'>
              <Radio size={16} className='text-primary' />
            </div>
            <Link to='/dashboard' className='font-heading font-extrabold text-white tracking-tight'>
              SmartVenueX
            </Link>
          </div>
          <div className='flex items-center gap-2'>
            {activeEvent?.event_code && profile?.role === 'admin' ? (
              <span className='rounded-full bg-primary/15 border border-primary/20 px-3 py-1 font-mono text-[10px] font-bold text-primary tracking-widest shadow-[0_0_10px_rgba(59,130,246,0.2)]'>
                {activeEvent.event_code}
              </span>
            ) : null}
            {profile?.role === 'admin' && (
              <button
                type='button'
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className='rounded-lg p-2 text-[#9CA3AF] hover:bg-[#111827] hover:text-white transition-colors'
                aria-label='Toggle menu'
              >
                <Menu size={20} />
              </button>
            )}
            {profile?.role !== 'admin' && (
              <button
                type='button'
                onClick={() => logout()}
                className='inline-flex items-center gap-1.5 rounded-lg border border-[#374151] bg-[#111827] px-3 py-1.5 text-xs font-bold text-[#9CA3AF] transition hover:bg-[#374151] hover:text-white backdrop-blur'
              >
                <LogOut size={13} /> Sign out
              </button>
            )}
          </div>
        </header>

        {/* Top event sub-header for Participants/Vendors on mobile */}
        {profile?.role !== 'admin' && activeEvent && (
          <div className='md:hidden bg-[#111827] border-b border-[#374151] px-4 py-1.5 flex justify-between items-center'>
            <p className='text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider'>
              {activeEvent.name}
            </p>
            <p className='text-[10px] text-primary font-bold uppercase tracking-wider'>
              {profile.role}
            </p>
          </div>
        )}

        {/* Mobile menu overlay exclusively for admin (since nav relies on this) */}
        {profile?.role === 'admin' && mobileMenuOpen ? (
          <div className='fixed inset-0 z-40 md:hidden' onClick={() => setMobileMenuOpen(false)}>
            <div className='absolute inset-0 bg-black/80 backdrop-blur-sm' />
            <div className='absolute left-0 top-0 h-full w-72 bg-[#0B1220] border-r border-[#374151]' onClick={(e) => e.stopPropagation()}>
              <Sidebar />
            </div>
          </div>
        ) : null}

        <main className={`flex-1 overflow-auto mx-auto w-full px-4 py-5 md:p-8 ${profile?.role !== 'admin' ? 'max-w-4xl pb-28 md:pb-8' : ''}`}>
          {children}
        </main>
      </div>

      {/* Bottom nav for Non-Admins on mobile */}
      {profile?.role !== 'admin' && (
        <BottomNav />
      )}
    </div>
  );
}
