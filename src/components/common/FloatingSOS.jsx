import { useState } from 'react';
import { AlertTriangle, Phone, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../config/supabase';

export default function FloatingSOS() {
  const { activeEvent, user, profile } = useAuth();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSos() {
    if (!activeEvent?.id) return;
    setBusy(true);
    try {
      const location = await new Promise((resolve) => {
        if (!navigator.geolocation) { resolve({}); return; }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => resolve({})
        );
      });

      const { error } = await supabase.from('sos_requests').insert({
        user_id: user?.id,
        event_id: activeEvent.id,
        message: message || 'Emergency assistance needed!',
        user_name: profile?.full_name || user?.email || 'Participant',
        location,
        status: 'open',
      });
      if (error) throw error;
      setSent(true);
      push('SOS alert sent to event admins! 🆘', 'success');
      setTimeout(() => { setSent(false); setMessage(''); setOpen(false); }, 3000);
    } catch (err) {
      push(err.message || 'Failed to send SOS', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        type='button'
        id='floating-sos-button'
        onClick={() => setOpen(true)}
        className='fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-transform hover:scale-110 active:scale-95 md:bottom-6 md:right-6'
        aria-label='Send SOS alert'
      >
        <Phone size={22} />
      </button>

      {/* Confirmation dialog */}
      {open ? (
        <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 pb-8 md:items-center'>
          <div className='w-full max-w-sm rounded-2xl border border-red-500/30 bg-[#1a0a0a] p-6 shadow-2xl'>
            <div className='flex items-start justify-between'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20'>
                  <AlertTriangle size={20} className='text-red-400' />
                </div>
                <div>
                  <h2 className='font-heading text-lg font-bold text-white'>Send SOS?</h2>
                  <p className='text-xs text-white/50'>Alert will include your location</p>
                </div>
              </div>
              <button
                type='button'
                onClick={() => setOpen(false)}
                className='rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white'
                aria-label='Close'
              >
                <X size={18} />
              </button>
            </div>

            {sent ? (
              <div className='mt-5 rounded-xl bg-emerald-900/40 border border-emerald-500/30 p-4 text-center'>
                <p className='text-lg'>✅</p>
                <p className='mt-1 font-semibold text-emerald-300'>SOS sent! Help is on the way.</p>
              </div>
            ) : (
              <>
                <textarea
                  className='mt-4 min-h-[80px] w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-red-500/40 placeholder-white/30'
                  placeholder='Optional: describe the emergency (e.g. fell near food court)'
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className='mt-3 grid grid-cols-2 gap-3'>
                  <button
                    type='button'
                    onClick={() => setOpen(false)}
                    className='rounded-xl border border-white/10 py-3 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    type='button'
                    onClick={handleSos}
                    disabled={busy}
                    className='rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50 transition-colors'
                  >
                    {busy ? 'Sending...' : '🆘 Send SOS'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
