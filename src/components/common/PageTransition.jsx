import { motion } from 'framer-motion';

export default function PageTransition({ children, className = '', ...props }) {
  return (
    <motion.main
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -12, opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.main>
  );
}
