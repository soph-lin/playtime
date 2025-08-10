"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { User } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "../effects/LoadingSpinner";

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

  useEffect(() => {
    if (isOpen && isLoaded && user) {
      fetchUserData();
    }
  }, [isOpen, isLoaded, user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !user) {
    return null;
  }

  const experienceToNextLevel = userData ? 100 - (userData.levelExperience % 100) : 0;
  const progressPercentage = userData ? ((userData.levelExperience % 100) / 100) * 100 : 0;

  return (
    <Modal title="Player Profile" isOpen={isOpen} onClose={onClose} className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                <img src={userData.avatarUrl} alt="Profile" className="w-20 h-20 rounded-full border-4 border-white" />
              )}
              <div className="text-left">
                <h2 className="text-2xl font-semibold text-white">
                  {userData.firstName && userData.lastName
                    ? `${userData.firstName} ${userData.lastName}`
                    : userData.username}
                </h2>
                <p className="text-gray-300">{userData.email}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">{userData.level}</div>
              <div className="text-white text-sm">Level</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">{userData.totalExperience}</div>
              <div className="text-white text-sm">Total XP</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">{userData.totalGames}</div>
              <div className="text-white text-sm">Games</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">{userData.gamesWon}</div>
              <div className="text-white text-sm">Wins</div>
            </div>
          </div>

          {/* Experience Bar */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Experience Progress</h3>
            <div className="mb-2 flex justify-between text-sm text-gray-300">
              <span>Level {userData.level}</span>
              <span>
                {userData.levelExperience} / {userData.level * 100} XP
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-300 mt-2">{experienceToNextLevel} XP needed for next level</p>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Game Performance</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Correct Guesses:</span>
                  <span className="text-white font-semibold">{userData.correctGuesses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Average Time:</span>
                  <span className="text-white font-semibold">
                    {userData.averageGuessTime > 0 ? `${userData.averageGuessTime.toFixed(2)}s` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Win Rate:</span>
                  <span className="text-white font-semibold">
                    {userData.totalGames > 0
                      ? `${((userData.gamesWon / userData.totalGames) * 100).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Account Info</h3>
              <div className="space-y-2 text-sm">
                <div className="text-gray-300">
                  Username: <span className="text-white">{userData.username}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Achievements</h3>
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
                        <div className="font-semibold text-white text-sm">{achievement.name}</div>
                        <div className="text-xs text-gray-300 truncate">{achievement.description}</div>
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
            <Button variant="outline" onClick={onClose} className="border-white/20 text-white hover:bg-white/10">
              Close
            </Button>
            <SignOutButton>
              <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/20">
                Sign Out
              </Button>
            </SignOutButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
