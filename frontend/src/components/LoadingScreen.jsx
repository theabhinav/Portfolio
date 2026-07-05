import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingScreen({ onFinish }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Hide loader after 2.2 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      // Wait for exit animation to finish before notifying parent
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 500);
    }, 2200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070d] text-white"
        >
          <div className="relative flex flex-col items-center">
            {/* Spinning/glowing ring */}
            <motion.div
              initial={{ scale: 0.8, rotate: 0 }}
              animate={{ scale: 1.1, rotate: 360 }}
              transition={{
                duration: 2,
                ease: 'easeInOut',
                repeat: 0,
              }}
              className="w-20 h-20 rounded-full border-2 border-t-[#7c6fff] border-r-[#4fd1ff] border-b-transparent border-l-transparent shadow-[0_0_30px_rgba(124,111,255,0.3)]"
            />
            
            {/* Pulsing inner dot */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0.5 }}
              animate={{ scale: [0.5, 1, 0.5], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-7 w-6 h-6 rounded-full bg-gradient-to-tr from-[#7c6fff] to-[#4fd1ff]"
            />

            {/* Glowing Text */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-8 font-heading text-xl md:text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#7c6fff] to-[#4fd1ff] uppercase"
            >
              AI Career Study
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-2 text-xs text-gray-400 tracking-wider font-mono"
            >
              Initializing Research Environment...
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
