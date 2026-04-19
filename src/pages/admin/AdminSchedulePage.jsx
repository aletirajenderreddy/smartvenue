/**
 * AdminSchedulePage.jsx
 * Admin can create, edit, and delete event schedule items.
 */
import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Calendar, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../../components/common/PageTransition';
import ScheduleTimeline from '../../components/schedule/ScheduleTimeline';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchSchedule,
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
} from '../../services/eventflow.service';

const TYPES = ['session', 'keynote', 'workshop', 'break', 'networking', 'other'];

const emptyForm = {
  title: '',
  description: '',
  start_time: '',
  end_time: '',
  location: '',
  speaker: '',
  type: 'session',
};

function toLocalDatetimeInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminSchedulePage() {
  const { activeEvent } = useAuth();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    if (!activeEvent?.id) return;
    setLoading(true);
    try {
      const data = await fetchSchedule(activeEvent.id);
      setSchedule(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [activeEvent?.id]);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      description: item.description || '',
      start_time: toLocalDatetimeInput(item.start_time),
      end_time: toLocalDatetimeInput(item.end_time),
      location: item.location || '',
      speaker: item.speaker || '',
      type: item.type || 'session',
    });
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = {
        ...form,
        event_id: activeEvent.id,
        start_time: new Date(form.start_time).toISOString(),
        end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
      };
      if (editingId) {
        await updateScheduleItem(editingId, payload);
        setSuccess('Session updated.');
      } else {
        await createScheduleItem(payload);
        setSuccess('Session added.');
      }
      closeForm();
      await load();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this schedule item?')) return;
    try {
      await deleteScheduleItem(id);
      await load();
      setSuccess('Session deleted.');
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  }

  const field = (key, label, extra = {}) => (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">{label}</span>
      <input
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors placeholder:text-white/30"
        value={form[key]}
        onChange={(e) => setForm((cur) => ({ ...cur, [key]: e.target.value }))}
        {...extra}
      />
    </label>
  );

  return (
    <PageTransition className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ArrowLeft size={15} />
          Dashboard
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-violet-400" />
            <h1 className="font-heading text-2xl font-bold text-white">Event Schedule</h1>
          </div>
          <p className="mt-0.5 text-sm text-white/50">{activeEvent?.name}</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          <Plus size={16} />
          Add Session
        </button>
      </div>

      {/* Feedback */}
      {error && <p className="rounded-xl bg-red-900/30 border border-red-500/20 px-4 py-3 text-sm text-red-200">{error}</p>}
      {success && <p className="rounded-xl bg-emerald-900/30 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-200">{success}</p>}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">{editingId ? 'Edit Session' : 'New Session'}</h2>
            <button type="button" onClick={closeForm} className="rounded-full p-1.5 hover:bg-white/10 transition-colors">
              <X size={16} className="text-white/60" />
            </button>
          </div>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            {field('title', 'Session Title', { required: true, placeholder: 'Opening Keynote', className: 'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors placeholder:text-white/30 md:col-span-2' })}

            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Session Type</span>
              <select
                className="w-full rounded-xl border border-white/10 bg-[#1a1f2e] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors capitalize"
                value={form.type}
                onChange={(e) => setForm((cur) => ({ ...cur, type: e.target.value }))}
              >
                {TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </label>

            {field('speaker', 'Speaker / Host', { placeholder: 'Dr. Jane Smith' })}

            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Start Time</span>
              <input
                type="datetime-local"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
                value={form.start_time}
                onChange={(e) => setForm((cur) => ({ ...cur, start_time: e.target.value }))}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">End Time (optional)</span>
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
                value={form.end_time}
                onChange={(e) => setForm((cur) => ({ ...cur, end_time: e.target.value }))}
              />
            </label>

            {field('location', 'Location / Hall', { placeholder: 'Main Stage, Room A…' })}

            <label className="space-y-1.5 md:col-span-2">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Description (optional)</span>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors resize-none placeholder:text-white/30"
                placeholder="Brief description of what this session covers…"
                value={form.description}
                onChange={(e) => setForm((cur) => ({ ...cur, description: e.target.value }))}
              />
            </label>

            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={closeForm} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                <Save size={15} />
                {busy ? 'Saving…' : editingId ? 'Update Session' : 'Add Session'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-white">Schedule Timeline</h2>
            <p className="text-sm text-white/50 mt-0.5">{schedule.length} session(s) · visible to all participants</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
          </div>
        ) : (
          <ScheduleTimeline
            schedule={schedule}
            onEdit={openEdit}
            onDelete={handleDelete}
            emptyMessage="No sessions added yet. Click 'Add Session' to create the event schedule."
          />
        )}
      </div>
    </PageTransition>
  );
}
