"use client";

type Player = {
  id: string;
  name: string;
  score: number;
};

interface LeaderboardProps {
  players: Player[];
}

export default function Leaderboard({ players }: LeaderboardProps) {
  // Sort players by score in descending order
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-4xl p-8 border-2 border-blue-200 rounded-xl shadow-xl bg-white">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Leaderboard</h2>
      <div className="space-y-4">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
              index === 0 ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" : "bg-blue-50 hover:bg-blue-100"
            }`}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? "bg-white text-blue-600" : "bg-blue-200 text-blue-700"
                }`}
              >
                {index + 1}
              </div>
              <span className="font-medium">{player.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold">{player.score}</span>
              <span className="text-sm text-blue-600">points</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
