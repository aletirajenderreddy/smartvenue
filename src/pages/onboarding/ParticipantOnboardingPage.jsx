import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import PageTransition from '../../components/common/PageTransition';
import { useAuth } from '../../hooks/useAuth';
import { completeParticipantOnboarding } from '../../services/eventflow.service';

const initialForm = {
  event_code: '',
  full_name: '',
  phone_number: '',
  college_name: '',
  organization: '',
  course: '',
  year_of_study: '',
  city: '',
  state: '',
  gender: '',
  emergency_contact: ''
};

export default function ParticipantOnboardingPage() {
  const { user, profile, refresh, loading } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [idProofFile, setIdProofFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!loading && !user) return <Navigate to='/login' replace />;
  if (profile?.role !== 'participant') return <Navigate to='/role-select' replace />;
  if (profile?.onboarding_completed) return <Navigate to='/dashboard' replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await completeParticipantOnboarding(form, idProofFile);
      await refresh();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to complete participant onboarding');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageTransition className='mx-auto max-w-4xl p-5 md:p-8'>
      <section className='rounded-lg border border-white/10 bg-white/[0.05] p-5 md:p-6'>
        <div className='space-y-2'>
          <p className='text-sm font-semibold uppercase tracking-wide text-primary'>Participant join</p>
          <h1 className='font-heading text-3xl font-bold'>Join with your event code</h1>
          <p className='text-sm text-white/70'>We’ll validate the event code, attach your profile, and generate your QR pass in the backend.</p>
        </div>

        <form className='mt-6 grid gap-4 md:grid-cols-2' onSubmit={handleSubmit}>
          <label className='space-y-2 md:col-span-2'>
            <span className='text-sm text-white/70'>Event code</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3 uppercase tracking-[0.2em]' value={form.event_code} onChange={(e) => setForm((cur) => ({ ...cur, event_code: e.target.value.toUpperCase() }))} required />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>Full name</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.full_name} onChange={(e) => setForm((cur) => ({ ...cur, full_name: e.target.value }))} required />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>Phone number</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.phone_number} onChange={(e) => setForm((cur) => ({ ...cur, phone_number: e.target.value }))} required />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>College</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.college_name} onChange={(e) => setForm((cur) => ({ ...cur, college_name: e.target.value }))} />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>Organization</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.organization} onChange={(e) => setForm((cur) => ({ ...cur, organization: e.target.value }))} />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>Course / department</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.course} onChange={(e) => setForm((cur) => ({ ...cur, course: e.target.value }))} />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>Year of study</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.year_of_study} onChange={(e) => setForm((cur) => ({ ...cur, year_of_study: e.target.value }))} />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>City</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.city} onChange={(e) => setForm((cur) => ({ ...cur, city: e.target.value }))} />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>State</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.state} onChange={(e) => setForm((cur) => ({ ...cur, state: e.target.value }))} />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>Gender</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.gender} onChange={(e) => setForm((cur) => ({ ...cur, gender: e.target.value }))} />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>Emergency contact</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.emergency_contact} onChange={(e) => setForm((cur) => ({ ...cur, emergency_contact: e.target.value }))} />
          </label>
          <label className='space-y-2 md:col-span-2'>
            <span className='text-sm text-white/70'>ID proof (optional)</span>
            <input type='file' className='w-full rounded-md border border-white/10 bg-white/10 p-3' onChange={(e) => setIdProofFile(e.target.files?.[0] || null)} />
          </label>

          {error ? <p className='rounded-md bg-danger/15 px-4 py-3 text-sm text-red-100 md:col-span-2'>{error}</p> : null}

          <div className='md:col-span-2 flex justify-end'>
            <button type='submit' disabled={busy} className='rounded-md bg-primary px-5 py-3 font-semibold text-white'>
              {busy ? 'Joining event...' : 'Join event and generate pass'}
            </button>
          </div>
        </form>
      </section>
    </PageTransition>
  );
}
