import { motion } from 'framer-motion';

export default function Section({ title, subtitle, children, actions = null, delay = 0 }) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-xl shadow-black/20"
    >
      <div className="border-b border-white/5 bg-white/[0.02] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-white">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-white/50">{subtitle}</p> : null}
          </div>
          {actions}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </motion.section>
  );
}
