import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return (
    <AnimatePresence>
      {!online ? (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className='fixed left-0 right-0 top-0 z-[60] bg-warning px-4 py-2 text-center text-sm font-bold text-black'
        >
          Offline mode. Cached ticket, venue map, and last-known stall data remain available.
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
