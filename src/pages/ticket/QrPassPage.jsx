import { useEffect, useState } from 'react';
import { Download, Ticket } from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';
import { useAuth } from '../../hooks/useAuth';
import { fetchParticipantPass } from '../../services/eventflow.service';

export default function QrPassPage() {
  const { profile, activeEvent } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    fetchParticipantPass(profile.id)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile?.id]);

  function handleDownload() {
    if (!data?.qrSignedUrl) return;
    const a = document.createElement('a');
    a.href = data.qrSignedUrl;
    a.download = `smartvenuex-pass-${data.id?.slice(0, 8) || 'qr'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (loading) {
    return (
      <PageTransition className='flex min-h-[60vh] flex-col items-center justify-center gap-4'>
        <div className='h-56 w-56 animate-pulse rounded-2xl bg-white/10' />
        <div className='h-4 w-40 animate-pulse rounded-full bg-white/10' />
      </PageTransition>
    );
  }

  return (
    <PageTransition className='flex flex-col items-center gap-6 py-6'>
      <div className='text-center'>
        <div className='inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 mb-3'>
          <Ticket size={14} className='text-primary' />
          <span className='text-xs font-bold text-primary'>Your Event Pass</span>
        </div>
        <h1 className='font-heading text-2xl font-bold text-white'>{activeEvent?.name || 'Event Pass'}</h1>
        <p className='mt-1 text-sm text-white/50'>Present this QR code at the entry gate</p>
      </div>

      {data?.qrSignedUrl ? (
        <div className='rounded-3xl border-2 border-primary/30 bg-white p-6 shadow-[0_0_60px_rgba(99,102,241,0.3)]'>
          <img
            src={data.qrSignedUrl}
            alt='Your QR event pass'
            className='h-56 w-56 rounded-xl object-contain'
          />
        </div>
      ) : (
        <div className='flex h-56 w-56 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/20 bg-white/5 gap-3'>
          <Ticket size={40} className='text-white/20' />
          <p className='text-xs text-white/40 text-center px-4'>QR pass is being generated. Refresh in a moment.</p>
        </div>
      )}

      {/* Participant details */}
      {data ? (
        <div className='w-full rounded-2xl border border-white/10 bg-white/5 p-5'>
          <div className='grid grid-cols-2 gap-3 text-sm'>
            {[
              { label: 'Name', value: data.full_name },
              { label: 'Phone', value: data.phone_number },
              { label: 'College', value: data.college_name || data.organization },
              { label: 'City', value: data.city },
              { label: 'Course', value: data.course },
              { label: 'Year', value: data.year_of_study }
            ].filter((item) => item.value).map(({ label, value }) => (
              <div key={label}>
                <p className='text-[11px] text-white/40 uppercase tracking-wide'>{label}</p>
                <p className='font-semibold text-white mt-0.5'>{value}</p>
              </div>
            ))}
          </div>
          <div className='mt-4 pt-4 border-t border-white/10'>
            <p className='text-[11px] text-white/40 uppercase tracking-wide'>Participant ID</p>
            <p className='font-mono text-xs text-white/60 mt-0.5 break-all'>{data.id}</p>
          </div>
        </div>
      ) : null}

      {data?.qrSignedUrl ? (
        <button
          type='button'
          id='download-qr-button'
          onClick={handleDownload}
          className='flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white hover:bg-white/10 transition-colors'
        >
          <Download size={18} />
          Download QR Pass
        </button>
      ) : null}
    </PageTransition>
  );
}
