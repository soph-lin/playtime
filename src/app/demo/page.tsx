"use client";

import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@/components/auth/SignInButton";
import Link from "next/link";

export default function DemoPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Playtime Demo</h1>
          <p className="text-xl text-gray-300">Authentication & Level System</p>
        </div>

        {!user ? (
          <div className="max-w-md mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-2xl font-semibold text-white mb-4">Welcome to Playtime!</h2>
            <p className="text-gray-300 mb-6">
              Sign in to start playing, earn experience points, and unlock achievements!
            </p>
            <SignInButton />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-8">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {user.firstName || user.username}!</h2>
                <p className="text-gray-300">You&apos;re signed in and ready to play!</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎯</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Start Playing</h3>
                  <p className="text-gray-300 text-sm">Jump into a game and start earning XP!</p>
                </div>

                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <h3 className="text-xl font-semibold text-white mb-2">View Profile</h3>
                  <p className="text-gray-300 text-sm">Check your level, experience, and achievements</p>
                </div>

                <div className="text-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Earn Rewards</h3>
                  <p className="text-gray-300 text-sm">Level up and unlock new achievements</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200">
                    Go to Menu
                  </button>
                </Link>

                <Link href="/profile">
                  <button className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 border border-white/30">
                    View Profile
                  </button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">How It Works</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs text-white">
                      1
                    </div>
                    <span>Sign in with your account</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                      2
                    </div>
                    <span>Play games and guess songs</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">
                      3
                    </div>
                    <span>Earn experience points</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs text-white">
                      4
                    </div>
                    <span>Level up and unlock achievements</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Features</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Secure authentication with Clerk</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Experience points and leveling system</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Achievement system with badges</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>User profiles and statistics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Real-time progress tracking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
