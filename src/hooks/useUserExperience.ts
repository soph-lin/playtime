import { useUser } from "@clerk/nextjs";
import { useState, useCallback } from "react";

interface ExperienceData {
  level: number;
  levelExperience: number;
  totalExperience: number;
}

export function useUserExperience() {
  const { user } = useUser();
  const [experienceData, setExperienceData] = useState<ExperienceData | null>(null);
  const [loading, setLoading] = useState(false);

  const addExperience = useCallback(
    async (points: number) => {
      if (!user) return false;

      setLoading(true);
      try {
        const response = await fetch("/api/profile/experience", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ points }),
        });

        if (response.ok) {
          const data = await response.json();
          setExperienceData(data.user);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error adding experience:", error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const calculateLevel = useCallback((experience: number) => {
    return Math.floor(experience / 100) + 1;
  }, []);

  const getExperienceToNextLevel = useCallback((experience: number, level: number) => {
    const nextLevelExp = level * 100;
    return nextLevelExp - experience;
  }, []);

  const getProgressPercentage = useCallback((experience: number, level: number) => {
    const currentLevelExp = (level - 1) * 100;
    const levelExp = experience - currentLevelExp;
    return (levelExp / 100) * 100;
  }, []);

  return {
    experienceData,
    loading,
    addExperience,
    calculateLevel,
    getExperienceToNextLevel,
    getProgressPercentage,
  };
}
