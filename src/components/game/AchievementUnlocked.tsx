"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Achievement {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string | null;
}

interface AchievementUnlockedProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export default function AchievementUnlocked({ achievement, onClose }: AchievementUnlockedProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {isVisible && achievement && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4 shadow-2xl text-white max-w-sm">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{achievement.icon || "🏆"}</div>
              <div>
                <h3 className="font-bold text-lg">Achievement Unlocked!</h3>
                <p className="font-semibold">{achievement.name}</p>
                <p className="text-sm text-gray-200">{achievement.description}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
