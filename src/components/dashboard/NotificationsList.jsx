import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';

export default function NotificationsList({ notifications }) {
  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {notifications.length ? (
          notifications.map((note) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={note.id} 
              className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Bell size={14} />
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{note.message}</p>
                  {note.target_role ? (
                    <span className="shrink-0 rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent border border-accent/20">
                      {note.target_role}
                    </span>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-sm text-center font-medium text-white/50 py-4"
          >
            No new announcements.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
