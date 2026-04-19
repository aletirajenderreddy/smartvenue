import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

/**
 * EmptyState — Reusable empty placeholder component.
 * Shows an icon, title, optional description, and optional action button.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description = '',
  action = null,    // { label: string, onClick: fn }
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-8 py-12 text-center ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] shadow-inner">
        <Icon size={24} className="text-white/30" />
      </div>
      <div>
        <p className="font-heading text-base font-bold text-white/60">{title}</p>
        {description ? <p className="mt-1 text-sm text-white/30 max-w-xs">{description}</p> : null}
      </div>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="rounded-xl border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-bold text-primary hover:bg-primary/20 transition-colors"
        >
          {action.label}
        </button>
      ) : null}
    </motion.div>
  );
}
