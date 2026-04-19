import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Check, Copy, Eye, EyeOff, LogOut, Plus, Radio, Ticket, Trash2, Sparkles } from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';
import { useAuth } from '../../hooks/useAuth';
import { attachExistingAdminEvent, createEvent, fetchAdminEvents } from '../../services/eventflow.service';
import { logout } from '../../services/auth.service';
import { geminiModel } from '../../config/gemini';

const emptyForm = {
  event_name: '',
  event_description: '',
  city: '',
  venue_name: '',
  latitude: '',
  longitude: '',
  event_start_date: '',
  event_end_date: '',
  max_participants: '500',
  number_of_stalls: '20',
  event_category: 'tech fest',
  contact_email: '',
  contact_phone: '',
  wifi_ssid: '',
  wifi_password: '',
};

function EventCodeModal({ eventCode, onContinue }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText(eventCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4'>
      <div className='w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] p-8 shadow-2xl text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20'>
          <Ticket size={30} className='text-primary' />
        </div>
        <h2 className='font-heading text-2xl font-bold text-white'>Event Created! 🎉</h2>
        <p className='mt-2 text-sm text-white/60'>Share this code with participants and vendors to join your event.</p>

        <div className='mt-6 rounded-2xl border-2 border-primary/30 bg-primary/10 px-6 py-5'>
          <p className='text-xs font-semibold uppercase tracking-widest text-primary/70 mb-2'>Event Code</p>
          <p className='font-mono text-4xl font-black tracking-[0.3em] text-primary'>{eventCode}</p>
        </div>

        <button
          type='button'
          onClick={handleCopy}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition-all ${
            copied ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy code</>}
        </button>

        <button
          type='button'
          onClick={onContinue}
          className='mt-3 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white hover:bg-primary/90 transition-colors'
        >
          Go to Admin Dashboard →
        </button>
      </div>
    </div>
  );
}

export default function AdminOnboardingPage() {
  const { user, profile, refresh, loading } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [bannerFile, setBannerFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [existingEvents, setExistingEvents] = useState([]);
  const [createdEventCode, setCreatedEventCode] = useState(null);
  const [showWifiPw, setShowWifiPw] = useState(false);
  const [helplines, setHelplines] = useState([{ label: 'Security', number: '' }]);
  const [aiBusy, setAiBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchAdminEvents(user.id).then(setExistingEvents).catch(() => {});
    }
  }, [user?.id]);

  if (!loading && !user) return <Navigate to='/login' replace />;
  if (profile?.role !== 'admin') return <Navigate to='/role-select' replace />;
  if (profile?.onboarding_completed) return <Navigate to='/dashboard' replace />;

  async function handleCreate(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const event = await createEvent(
        {
          ...form,
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
          max_participants: Number(form.max_participants),
          number_of_stalls: Number(form.number_of_stalls),
          helpline_numbers: helplines.filter((h) => h.number.trim()),
        },
        bannerFile
      );
      setCreatedEventCode(event?.event_code || '—');
      await refresh();
    } catch (err) {
      setError(err.message || 'Unable to create event');
      setBusy(false);
    }
  }

  async function handleExisting(eventId) {
    setBusy(true);
    setError('');
    try {
      await attachExistingAdminEvent(eventId);
      await refresh();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to open existing event');
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateDescription() {
    if (!form.event_name) {
      setError('Please enter an event name first so the AI knows what to write about.');
      return;
    }
    setAiBusy(true);
    setError('');
    try {
      const prompt = `Write an exciting, professional event description (3-4 sentences) for an event named "${form.event_name}" in the category "${form.event_category}". Make it sound premium. No markdown formatting.`;
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      setForm(prev => ({ ...prev, event_description: text.trim().replace(/^"/, '').replace(/"$/, '') }));
    } catch (err) {
      setError('AI generation failed. Please type manually or check API keys.');
    } finally {
      setAiBusy(false);
    }
  }

  const field = (key, label, extra = {}) => (
    <label className='space-y-1.5'>
      <span className='text-sm text-white/70'>{label}</span>
      <input
        className='w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm outline-none focus:border-primary/50 transition-colors'
        value={form[key]}
        onChange={(e) => setForm((cur) => ({ ...cur, [key]: e.target.value }))}
        {...extra}
      />
    </label>
  );

  return (
    <>
      {createdEventCode ? (
        <EventCodeModal
          eventCode={createdEventCode}
          onContinue={() => navigate('/dashboard', { replace: true })}
        />
      ) : null}

      <PageTransition className='mx-auto max-w-6xl p-5 md:p-8'>
        {/* Sticky top bar with Sign Out */}
        <div className='mb-6 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Radio size={18} className='text-primary' />
            <span className='font-heading font-bold text-white'>SmartVenueX</span>
            <span className='rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary'>Admin Setup</span>
          </div>
          <button
            type='button'
            onClick={() => logout()}
            className='flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors'
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
        <div className='grid gap-6 lg:grid-cols-[1.25fr,0.75fr]'>
          {/* Create event form */}
          <section className='rounded-2xl border border-white/10 bg-white/[0.04] p-6'>
            <div className='space-y-1'>
              <p className='text-sm font-bold uppercase tracking-widest text-primary'>Admin Setup</p>
              <h1 className='font-heading text-3xl font-bold'>Create a new event</h1>
              <p className='text-sm text-white/60'>Fill in the details to generate your event and get an event code.</p>
            </div>

            <form className='mt-6 grid gap-4 md:grid-cols-2' onSubmit={handleCreate}>
              {field('event_name', 'Event name', { required: true, 'className': 'w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm outline-none focus:border-primary/50 transition-colors md:col-span-2' })}
              <label className='space-y-1.5 md:col-span-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-white/70'>Description</span>
                  <button type="button" onClick={handleGenerateDescription} disabled={aiBusy} className="flex items-center gap-1.5 rounded-lg bg-primary/20 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/30 transition-colors">
                    <Sparkles size={12} /> {aiBusy ? 'Generating...' : 'Auto-Generate'}
                  </button>
                </div>
                <textarea
                  className='min-h-24 w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm outline-none focus:border-primary/50 transition-colors resize-none'
                  value={form.event_description}
                  onChange={(e) => setForm((cur) => ({ ...cur, event_description: e.target.value }))}
                  required
                />
              </label>
              {field('city', 'City', { required: true })}
              {field('venue_name', 'Venue name', { required: true })}
              {field('latitude', 'Latitude', { placeholder: '17.3850' })}
              {field('longitude', 'Longitude', { placeholder: '78.4867' })}
              <label className='space-y-1.5'>
                <span className='text-sm text-white/70'>Start date</span>
                <input type='datetime-local' className='w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm outline-none focus:border-primary/50 transition-colors' value={form.event_start_date} onChange={(e) => setForm((cur) => ({ ...cur, event_start_date: e.target.value }))} required />
              </label>
              <label className='space-y-1.5'>
                <span className='text-sm text-white/70'>End date</span>
                <input type='datetime-local' className='w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm outline-none focus:border-primary/50 transition-colors' value={form.event_end_date} onChange={(e) => setForm((cur) => ({ ...cur, event_end_date: e.target.value }))} required />
              </label>
              <label className='space-y-1.5'>
                <span className='text-sm text-white/70'>Max participants</span>
                <input type='number' min='1' className='w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm outline-none focus:border-primary/50 transition-colors' value={form.max_participants} onChange={(e) => setForm((cur) => ({ ...cur, max_participants: e.target.value }))} required />
              </label>
              <label className='space-y-1.5'>
                <span className='text-sm text-white/70'>Number of stalls</span>
                <input type='number' min='0' className='w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm outline-none focus:border-primary/50 transition-colors' value={form.number_of_stalls} onChange={(e) => setForm((cur) => ({ ...cur, number_of_stalls: e.target.value }))} required />
              </label>
              <label className='space-y-1.5'>
                <span className='text-sm text-white/70'>Category</span>
                <select className='w-full rounded-xl border border-white/10 bg-[#1a2236] p-3 text-sm outline-none focus:border-primary/50 transition-colors' value={form.event_category} onChange={(e) => setForm((cur) => ({ ...cur, event_category: e.target.value }))}>
                  <option>tech fest</option>
                  <option>cultural fest</option>
                  <option>sports meet</option>
                  <option>hackathon</option>
                  <option>conference</option>
                  <option>workshop</option>
                  <option>other</option>
                </select>
              </label>
              {field('contact_email', 'Contact email', { type: 'email' })}
              {field('contact_phone', 'Contact phone')}

              {/* WiFi Credentials */}
              <div className='md:col-span-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3'>
                <p className='text-xs font-bold uppercase tracking-widest text-blue-400'>📶 Event WiFi (shared on participant pass)</p>
                <div className='grid gap-3 md:grid-cols-2'>
                  <label className='space-y-1.5'>
                    <span className='text-sm text-white/70'>WiFi Network Name (SSID)</span>
                    <input
                      className='w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm outline-none focus:border-primary/50 transition-colors'
                      placeholder='EventVenueWiFi'
                      value={form.wifi_ssid}
                      onChange={(e) => setForm((cur) => ({ ...cur, wifi_ssid: e.target.value }))}
                    />
                  </label>
                  <label className='space-y-1.5'>
                    <span className='text-sm text-white/70'>WiFi Password</span>
                    <div className='relative'>
                      <input
                        type={showWifiPw ? 'text' : 'password'}
                        className='w-full rounded-xl border border-white/10 bg-white/10 p-3 pr-10 text-sm outline-none focus:border-primary/50 transition-colors'
                        placeholder='••••••••'
                        value={form.wifi_password}
                        onChange={(e) => setForm((cur) => ({ ...cur, wifi_password: e.target.value }))}
                      />
                      <button
                        type='button'
                        onClick={() => setShowWifiPw((v) => !v)}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors'
                      >
                        {showWifiPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>
                </div>
              </div>

              {/* Helpline Numbers */}
              <div className='md:col-span-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3'>
                <div className='flex items-center justify-between'>
                  <p className='text-xs font-bold uppercase tracking-widest text-amber-400'>📞 Helpline Numbers (shown on pass)</p>
                  <button
                    type='button'
                    onClick={() => setHelplines((prev) => [...prev, { label: '', number: '' }])}
                    className='flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors'
                  >
                    <Plus size={13} /> Add number
                  </button>
                </div>
                <div className='space-y-2'>
                  {helplines.map((h, i) => (
                    <div key={i} className='flex items-center gap-2'>
                      <input
                        className='flex-1 rounded-xl border border-white/10 bg-white/10 p-2.5 text-sm outline-none focus:border-primary/50 transition-colors'
                        placeholder='Label (e.g. Security)'
                        value={h.label}
                        onChange={(e) => setHelplines((prev) => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                      />
                      <input
                        className='flex-1 rounded-xl border border-white/10 bg-white/10 p-2.5 text-sm outline-none focus:border-primary/50 transition-colors'
                        placeholder='Phone number'
                        value={h.number}
                        onChange={(e) => setHelplines((prev) => prev.map((x, j) => j === i ? { ...x, number: e.target.value } : x))}
                      />
                      {helplines.length > 1 && (
                        <button
                          type='button'
                          onClick={() => setHelplines((prev) => prev.filter((_, j) => j !== i))}
                          className='rounded-lg p-2 text-red-400 hover:bg-red-500/20 transition-colors'
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <label className='space-y-1.5 md:col-span-2'>
                <span className='text-sm text-white/70'>Banner image (optional)</span>
                <input
                  type='file'
                  accept='image/*'
                  className='w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary/20 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary'
                  onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                />
              </label>

              {error ? <p className='rounded-xl bg-red-900/40 px-4 py-3 text-sm text-red-200 md:col-span-2'>{error}</p> : null}

              <div className='md:col-span-2 flex justify-end'>
                <button type='submit' disabled={busy} className='rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors'>
                  {busy ? 'Creating event...' : 'Create event & get code'}
                </button>
              </div>
            </form>
          </section>

          {/* Existing events */}
          <aside className='rounded-2xl border border-white/10 bg-white/[0.04] p-6'>
            <p className='text-sm font-bold uppercase tracking-widest text-emerald-400'>Option 2</p>
            <h2 className='mt-1 font-heading text-2xl font-bold'>Open existing event</h2>
            <p className='mt-1 text-sm text-white/60'>Jump straight back into a dashboard you already own.</p>

            <div className='mt-5 space-y-3'>
              {existingEvents.length ? (
                existingEvents.map((event) => (
                  <button
                    key={event.id}
                    type='button'
                    onClick={() => handleExisting(event.id)}
                    disabled={busy}
                    className='w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition-colors'
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <div>
                        <p className='font-semibold text-white text-sm'>{event.name}</p>
                        <p className='font-mono text-xs text-primary mt-0.5'>{event.event_code}</p>
                      </div>
                      <span className='shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary'>
                        {event.category}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className='rounded-xl border border-dashed border-white/10 p-6 text-center'>
                  <p className='text-sm text-white/40'>No existing events yet.</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </PageTransition>
    </>
  );
}
