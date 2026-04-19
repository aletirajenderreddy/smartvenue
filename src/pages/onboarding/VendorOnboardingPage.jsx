import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import PageTransition from '../../components/common/PageTransition';
import { useAuth } from '../../hooks/useAuth';
import { completeVendorOnboarding } from '../../services/eventflow.service';

const initialForm = {
  event_code: '',
  vendor_name: '',
  owner_name: '',
  phone_number: '',
  service_type: 'food',
  stall_name: '',
  items_offered: '',
  pricing_range: '',
  required_resources: '',
  setup_time: ''
};

export default function VendorOnboardingPage() {
  const { user, profile, refresh, loading } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [licenseFile, setLicenseFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!loading && !user) return <Navigate to='/login' replace />;
  if (profile?.role !== 'vendor') return <Navigate to='/role-select' replace />;
  if (profile?.onboarding_completed) return <Navigate to='/dashboard' replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await completeVendorOnboarding(form, licenseFile);
      await refresh();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to complete vendor onboarding');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageTransition className='mx-auto max-w-4xl p-5 md:p-8'>
      <section className='rounded-lg border border-white/10 bg-white/[0.05] p-5 md:p-6'>
        <div className='space-y-2'>
          <p className='text-sm font-semibold uppercase tracking-wide text-primary'>Vendor join</p>
          <h1 className='font-heading text-3xl font-bold'>Set up your stall access</h1>
          <p className='text-sm text-white/70'>Join with the event code and we’ll assign you the next available stall in the backend.</p>
        </div>

        <form className='mt-6 grid gap-4 md:grid-cols-2' onSubmit={handleSubmit}>
          <label className='space-y-2 md:col-span-2'>
            <span className='text-sm text-white/70'>Event code</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3 uppercase tracking-[0.2em]' value={form.event_code} onChange={(e) => setForm((cur) => ({ ...cur, event_code: e.target.value.toUpperCase() }))} required />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>Vendor name</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.vendor_name} onChange={(e) => setForm((cur) => ({ ...cur, vendor_name: e.target.value }))} required />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>Owner name</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.owner_name} onChange={(e) => setForm((cur) => ({ ...cur, owner_name: e.target.value }))} required />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>Phone number</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.phone_number} onChange={(e) => setForm((cur) => ({ ...cur, phone_number: e.target.value }))} required />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>Service type</span>
            <select className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.service_type} onChange={(e) => setForm((cur) => ({ ...cur, service_type: e.target.value }))}>
              <option value='food'>Food</option>
              <option value='merchandise'>Merchandise</option>
              <option value='service'>Service</option>
              <option value='other'>Other</option>
            </select>
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>Preferred stall name</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.stall_name} onChange={(e) => setForm((cur) => ({ ...cur, stall_name: e.target.value }))} />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>Items offered</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.items_offered} onChange={(e) => setForm((cur) => ({ ...cur, items_offered: e.target.value }))} placeholder='Biryani, Cold drinks, Water' />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>Pricing range</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.pricing_range} onChange={(e) => setForm((cur) => ({ ...cur, pricing_range: e.target.value }))} placeholder='₹80 - ₹250' />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>Required resources</span>
            <input className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.required_resources} onChange={(e) => setForm((cur) => ({ ...cur, required_resources: e.target.value }))} placeholder='electricity, water' />
          </label>
          <label className='space-y-2'>
            <span className='text-sm text-white/70'>Setup time needed</span>
            <input type='text' className='w-full rounded-md border border-white/10 bg-white/10 p-3' value={form.setup_time} onChange={(e) => setForm((cur) => ({ ...cur, setup_time: e.target.value }))} placeholder='e.g. 30 minutes, 1 hour' />
          </label>
          <label className='space-y-2 md:col-span-2'>
            <span className='text-sm text-white/70'>License document (optional)</span>
            <input type='file' className='w-full rounded-md border border-white/10 bg-white/10 p-3' onChange={(e) => setLicenseFile(e.target.files?.[0] || null)} />
          </label>

          {error ? <p className='rounded-md bg-danger/15 px-4 py-3 text-sm text-red-100 md:col-span-2'>{error}</p> : null}

          <div className='md:col-span-2 flex justify-end'>
            <button type='submit' disabled={busy} className='rounded-md bg-primary px-5 py-3 font-semibold text-white'>
              {busy ? 'Assigning stall...' : 'Join event as vendor'}
            </button>
          </div>
        </form>
      </section>
    </PageTransition>
  );
}
