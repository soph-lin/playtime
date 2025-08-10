"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import { User } from "@prisma/client";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "../effects/LoadingSpinner";
import { SignOutButton } from "./SignOutButton";

interface Achievement {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string | null;
  unlockedAt: string;
}

interface UserWithAchievements extends User {
  achievements: Achievement[];
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, isLoaded } = useUser();
  const [userData, setUserData] = useState<UserWithAchievements | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editingUsername, setEditingUsername] = useState("");
  const [animatedXP, setAnimatedXP] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && isLoaded && user) {
      fetchUserData();
    }
  }, [isOpen, isLoaded, user]);

  useEffect(() => {
    if (userData && !loading) {
      // Animate XP counter from 0 to current value
      const duration = 1500; // 1.5 seconds
      const steps = 60;
      const increment = userData.totalExperience / steps;
      const stepDuration = duration / steps;

      let currentXP = 0;
      const timer = setInterval(() => {
        currentXP += increment;
        if (currentXP >= userData.totalExperience) {
          currentXP = userData.totalExperience;
          clearInterval(timer);
        }
        setAnimatedXP(Math.floor(currentXP));
      }, stepDuration);

      // Animate progress bar from 0 to current value
      const progressIncrement = (userData.levelExperience % 100) / steps;
      let currentProgress = 0;
      const progressTimer = setInterval(() => {
        currentProgress += progressIncrement;
        if (currentProgress >= userData.levelExperience % 100) {
          currentProgress = userData.levelExperience % 100;
          clearInterval(progressTimer);
        }
        setAnimatedProgress(currentProgress);
      }, stepDuration);

      return () => {
        clearInterval(timer);
        clearInterval(progressTimer);
      };
    }
  }, [userData, loading]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setEditingUsername(data.user.username);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameEdit = () => {
    setIsEditingUsername(true);
  };

  const handleUsernameSave = async () => {
    if (!editingUsername.trim() || editingUsername === userData?.username) {
      setIsEditingUsername(false);
      return;
    }

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: editingUsername.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setIsEditingUsername(false);
      } else {
        console.error("Failed to update username");
      }
    } catch (error) {
      console.error("Error updating username:", error);
    }
  };

  const handleUsernameCancel = () => {
    setEditingUsername(userData?.username || "");
    setIsEditingUsername(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUsernameSave();
    } else if (e.key === "Escape") {
      handleUsernameCancel();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (usernameInputRef.current && !usernameInputRef.current.contains(event.target as Node)) {
        handleUsernameCancel();
      }
    };

    if (isEditingUsername) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isEditingUsername]);

  if (!isLoaded || !user) {
    return null;
  }

  const experienceToNextLevel = userData ? 100 - (userData.levelExperience % 100) : 0;
  const progressPercentage = userData ? (animatedProgress / 100) * 100 : 0;

  return (
    <Modal
      title="Player Profile"
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl max-h-[90vh] overflow-y-auto text-cerulean"
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : !userData ? (
        <div className="text-center py-8">
          <div className="text-red-400 text-lg">Error loading profile data</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              {userData.avatarUrl && (
                <img
                  src={userData.avatarUrl}
                  alt="Profile"
                  className={`w-20 h-20 rounded-full border-4 border-white transition-transform duration-300 ${
                    isEditingUsername ? "transform -translate-x-2" : "transform translate-x-0"
                  }`}
                  style={{ transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
                />
              )}
              <div
                className={`text-left transition-all duration-300 ${
                  isEditingUsername ? "transform -translate-x-2" : "transform translate-x-0"
                }`}
                style={{ transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
              >
                {isEditingUsername ? (
                  <div className="flex items-center">
                    <input
                      ref={usernameInputRef}
                      type="text"
                      value={editingUsername}
                      onChange={(e) => setEditingUsername(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="text-2xl font-semibold bg-transparent border-b-2 border-cerulean focus:outline-none focus:border-baby-blue px-1"
                      autoFocus
                      maxLength={20}
                    />
                  </div>
                ) : (
                  <h2
                    className="text-2xl font-semibold cursor-pointer hover:text-baby-blue transition-colors select-none"
                    onClick={handleUsernameEdit}
                    title="Click to edit username"
                  >
                    {userData.username}
                  </h2>
                )}
                <p>{userData.email}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">{userData.level}</div>
              <div className=" text-sm">Level</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">{animatedXP.toLocaleString()}</div>
              <div className=" text-sm">Total XP</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">{userData.totalGames}</div>
              <div className=" text-sm">Games</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">{userData.gamesWon}</div>
              <div className=" text-sm">Wins</div>
            </div>
          </div>

          {/* Experience Bar */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span>Level {userData.level}</span>
              <span>
                {Math.floor(animatedProgress)} / {userData.level * 100} XP
              </span>
            </div>
            <div className="w-full bg-baby-blue rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-baby-blue to-cerulean h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm mt-2">{experienceToNextLevel} XP needed for next level</p>
          </div>

          {/* Achievements */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-lg font-semibold  mb-3">Achievements</h3>
            {userData.achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {userData.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{achievement.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold  text-sm">{achievement.name}</div>
                        <div className="text-xs  truncate">{achievement.description}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-6">
                <div className="text-3xl mb-2">🏆</div>
                <p className="text-sm">No achievements yet. Keep playing to unlock them!</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/20">
            <SignOutButton />
          </div>
        </div>
      )}
    </Modal>
  );
}
