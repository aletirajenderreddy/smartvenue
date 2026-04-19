import { motion } from 'framer-motion';

export default function StatCard({ label, value, tone = 'primary', delay = 0 }) {
  const tones = {
    primary: 'bg-primary/20 text-primary border-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]',
    success: 'bg-success/20 text-success border-success/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    warning: 'bg-warning/20 text-warning border-warning/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    danger: 'bg-danger/20 text-danger border-danger/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    accent: 'bg-accent/20 text-accent border-accent/20 shadow-[0_0_15px_rgba(34,211,238,0.15)]',
  };

  return (
    <motion.article 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur-md transition-all hover:bg-white/[0.05]"
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/[0.02] blur-xl" />
      <p className="text-sm font-medium text-white/50">{label}</p>
      <div className={`mt-3 inline-flex items-center justify-center rounded-lg border px-3 py-2 font-heading text-2xl font-bold ${tones[tone]}`}>
        {value}
      </div>
    </motion.article>
  );
}
