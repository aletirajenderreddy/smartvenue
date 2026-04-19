/**
 * Map crowd_density (0-100) to a colour tier with label, CSS classes and emoji.
 */
export function getCrowdTier(density = 0) {
  const d = Number(density) || 0;
  if (d <= 40) {
    return {
      label: 'Low',
      emoji: '🟢',
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bar: 'bg-emerald-500',
      dot: 'bg-emerald-400'
    };
  }
  if (d <= 70) {
    return {
      label: 'Medium',
      emoji: '🟡',
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      bar: 'bg-amber-500',
      dot: 'bg-amber-400'
    };
  }
  return {
    label: 'High',
    emoji: '🔴',
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    border: 'border-red-500/30',
    bar: 'bg-red-500',
    dot: 'bg-red-400'
  };
}

/** Friendly relative time string */
export function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
