/**
 * ScheduleTimeline.jsx
 * Beautiful event schedule timeline for both admin (view) and participant (view).
 * Color-coded by session type with live "now" indicator.
 */
import { Clock, MapPin, User, ChevronRight } from 'lucide-react';

const TYPE_CONFIG = {
  keynote: {
    label: 'Keynote',
    bg: 'bg-violet-500/20',
    border: 'border-violet-500/40',
    badge: 'bg-violet-500/30 text-violet-200',
    dot: 'bg-violet-400',
    glow: 'shadow-violet-500/20',
  },
  session: {
    label: 'Session',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/40',
    badge: 'bg-blue-500/30 text-blue-200',
    dot: 'bg-blue-400',
    glow: 'shadow-blue-500/20',
  },
  workshop: {
    label: 'Workshop',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/40',
    badge: 'bg-emerald-500/30 text-emerald-200',
    dot: 'bg-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  break: {
    label: 'Break',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500/30 text-amber-200',
    dot: 'bg-amber-400',
    glow: 'shadow-amber-500/20',
  },
  networking: {
    label: 'Networking',
    bg: 'bg-pink-500/20',
    border: 'border-pink-500/40',
    badge: 'bg-pink-500/30 text-pink-200',
    dot: 'bg-pink-400',
    glow: 'shadow-pink-500/20',
  },
  other: {
    label: 'Other',
    bg: 'bg-white/10',
    border: 'border-white/20',
    badge: 'bg-white/20 text-white/70',
    dot: 'bg-white/50',
    glow: '',
  },
};

function getConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.other;
}

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

function groupByDay(items) {
  const groups = {};
  for (const item of items) {
    const day = new Date(item.start_time).toDateString();
    if (!groups[day]) groups[day] = { label: formatDate(item.start_time), items: [] };
    groups[day].items.push(item);
  }
  return Object.values(groups);
}

function isNow(item) {
  const now = Date.now();
  const start = new Date(item.start_time).getTime();
  const end = item.end_time ? new Date(item.end_time).getTime() : start + 3600000;
  return now >= start && now <= end;
}

function isPast(item) {
  const end = item.end_time ? new Date(item.end_time).getTime() : new Date(item.start_time).getTime() + 3600000;
  return Date.now() > end;
}

function ScheduleItem({ item, onEdit, onDelete }) {
  const cfg = getConfig(item.type);
  const now = isNow(item);
  const past = isPast(item);

  return (
    <div
      className={`relative flex gap-4 group transition-all duration-200 ${past ? 'opacity-50' : ''}`}
    >
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center">
        <div className={`relative mt-1 h-3 w-3 rounded-full flex-shrink-0 ${cfg.dot} ${now ? 'ring-2 ring-white/40 ring-offset-1 ring-offset-[#0f172a] animate-pulse' : ''}`} />
        <div className="mt-1 flex-1 w-px bg-white/10" />
      </div>

      {/* Card */}
      <div
        className={`mb-4 flex-1 rounded-xl border p-4 transition-all duration-200 ${cfg.bg} ${cfg.border} ${now ? `shadow-lg ${cfg.glow}` : ''}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {now && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  Live
                </span>
              )}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}>
                {getConfig(item.type).label}
              </span>
            </div>
            <h3 className="font-semibold text-white text-sm leading-snug">{item.title}</h3>
            {item.description && (
              <p className="mt-1 text-xs text-white/60 line-clamp-2">{item.description}</p>
            )}
          </div>

          {/* Admin actions */}
          {(onEdit || onDelete) && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="rounded-md bg-white/10 hover:bg-white/20 px-2 py-1 text-xs text-white/70 transition-colors"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="rounded-md bg-red-500/20 hover:bg-red-500/30 px-2 py-1 text-xs text-red-300 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/50">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatTime(item.start_time)}
            {item.end_time ? ` → ${formatTime(item.end_time)}` : ''}
          </span>
          {item.location && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {item.location}
            </span>
          )}
          {item.speaker && (
            <span className="flex items-center gap-1">
              <User size={11} />
              {item.speaker}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ScheduleTimeline({ schedule = [], onEdit, onDelete, emptyMessage }) {
  if (!schedule.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 py-12 px-6 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <Clock size={22} className="text-white/40" />
        </div>
        <p className="text-sm font-medium text-white/60">
          {emptyMessage || 'No schedule published yet'}
        </p>
        <p className="mt-1 text-xs text-white/30">Check back soon for updates</p>
      </div>
    );
  }

  const sorted = [...schedule].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const days = groupByDay(sorted);

  return (
    <div className="space-y-6">
      {days.map((day) => (
        <div key={day.label}>
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">{day.label}</h3>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div>
            {day.items.map((item) => (
              <ScheduleItem key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
