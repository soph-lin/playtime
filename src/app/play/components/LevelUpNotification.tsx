"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LevelUpNotificationProps {
  show: boolean;
  newLevel: number;
  onClose: () => void;
}

export default function LevelUpNotification({ show, newLevel, onClose }: LevelUpNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500); // Wait for animation to complete
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-8 shadow-2xl text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-2">Level Up!</h2>
            <p className="text-xl text-white">Congratulations! You&apos;ve reached</p>
            <div className="text-5xl font-bold text-white my-4">Level {newLevel}</div>
            <p className="text-lg text-white">Keep playing to level up more!</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
