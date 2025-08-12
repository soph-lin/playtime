"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

interface UserStats {
  level: number;
  levelExperience: number;
  totalExperience: number;
}

export default function UserStats() {
  const { user } = useUser();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setStats(data.user);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return null;
  }

  if (!stats) {
    return null;
  }

  const progressPercentage = ((stats.levelExperience % 100) / 100) * 100;

  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
        <div className="flex items-center space-x-3 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">Lv.{stats.level}</div>
            <div className="text-xs text-gray-300">Level</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">{stats.totalExperience}</div>
            <div className="text-xs text-gray-300">Total XP</div>
          </div>
        </div>

        {/* Experience Bar */}
        <div className="w-32">
          <div className="flex justify-between text-xs text-gray-300 mb-1">
            <span>{stats.levelExperience % 100}</span>
            <span>100</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
