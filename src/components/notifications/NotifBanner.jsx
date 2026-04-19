import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function NotifBanner() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 2800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className='fixed left-4 right-4 top-4 z-50 rounded-md bg-primary px-4 py-2 text-center text-sm font-bold shadow-xl md:left-auto md:w-96'
        >
          Connected to Smart Venue live updates
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
