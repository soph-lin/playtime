"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { User } from "@prisma/client";

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

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [userData, setUserData] = useState<UserWithAchievements | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserData();
    }
  }, [isLoaded, user]);

  const fetchUserData = async () => {
    try {
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

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Please sign in to view your profile</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Error loading profile data</div>
      </div>
    );
  }

  const experienceToNextLevel = 100 - (userData.levelExperience % 100);
  const progressPercentage = ((userData.levelExperience % 100) / 100) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Player Profile</h1>
          <div className="flex items-center justify-center space-x-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">{userData.level}</div>
            <div className="text-white">Level</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">{userData.totalExperience}</div>
            <div className="text-white">Total Experience</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">{userData.totalGames}</div>
            <div className="text-white">Games Played</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">{userData.gamesWon}</div>
            <div className="text-white">Games Won</div>
          </div>
        </div>

        {/* Experience Bar */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Experience Progress</h3>
          <div className="mb-2 flex justify-between text-sm text-gray-300">
            <span>Level {userData.level}</span>
            <span>
              {userData.levelExperience} / {userData.level * 100} XP
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-300 mt-2">{experienceToNextLevel} XP needed for next level</p>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Game Performance</h3>
            <div className="space-y-3">
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
                  {userData.totalGames > 0 ? `${((userData.gamesWon / userData.totalGames) * 100).toFixed(1)}%` : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-2 text-sm">
              <div className="text-gray-300">User ID: {userData.id}</div>
              <div className="text-gray-300">Clerk ID: {userData.clerkId}</div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Achievements</h3>
          {userData.achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userData.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <div className="font-semibold text-white">{achievement.name}</div>
                      <div className="text-sm text-gray-300">{achievement.description}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">🏆</div>
              <p>No achievements yet. Keep playing to unlock them!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
