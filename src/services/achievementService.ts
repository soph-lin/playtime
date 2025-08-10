import prisma from "@/lib/db";

export interface GameStats {
  totalGames: number;
  gamesWon: number;
  correctGuesses: number;
  totalGuesses: number;
  totalPoints: number;
}

export interface AchievementData {
  userId: string;
  type: string;
  name: string;
  description: string;
  icon: string;
}

export class AchievementService {
  static async checkAndUnlockAchievements(userId: string, gameStats: GameStats) {
    const achievements = [];

    // Check for first game achievement
    if (gameStats.totalGames === 1) {
      const achievement = await this.createAchievement({
        userId,
        type: "first_game",
        name: "First Steps",
        description: "Played your first game!",
        icon: "🎮",
      });
      if (achievement) achievements.push(achievement);
    }

    // Check for first win achievement
    if (gameStats.gamesWon === 1) {
      const achievement = await this.createAchievement({
        userId,
        type: "first_win",
        name: "Winner!",
        description: "Won your first game!",
        icon: "🏆",
      });
      if (achievement) achievements.push(achievement);
    }

    // Check for perfect game achievement (all correct guesses)
    if (gameStats.correctGuesses > 0 && gameStats.totalGuesses === gameStats.correctGuesses) {
      const achievement = await this.createAchievement({
        userId,
        type: "perfect_game",
        name: "Perfect Game!",
        description: "Got all guesses correct in a game!",
        icon: "⭐",
      });
      if (achievement) achievements.push(achievement);
    }

    // Check for milestone achievements
    const milestones = [
      { games: 10, name: "Regular Player", description: "Played 10 games", icon: "🎯" },
      { games: 25, name: "Dedicated Player", description: "Played 25 games", icon: "🎪" },
      { games: 50, name: "Veteran Player", description: "Played 50 games", icon: "👑" },
      { games: 100, name: "Legendary Player", description: "Played 100 games", icon: "🌟" },
    ];

    for (const milestone of milestones) {
      if (gameStats.totalGames === milestone.games) {
        const achievement = await this.createAchievement({
          userId,
          type: "milestone",
          name: milestone.name,
          description: milestone.description,
          icon: milestone.icon,
        });
        if (achievement) achievements.push(achievement);
      }
    }

    // Check for points milestones
    const pointsMilestones = [
      { points: 100, name: "Point Collector", description: "Earned 100 points", icon: "💰" },
      { points: 500, name: "Point Hoarder", description: "Earned 500 points", icon: "💎" },
      { points: 1000, name: "Point Master", description: "Earned 1000 points", icon: "💍" },
    ];

    for (const milestone of pointsMilestones) {
      if (gameStats.totalPoints >= milestone.points) {
        const achievement = await this.createAchievement({
          userId,
          type: "points_milestone",
          name: milestone.name,
          description: milestone.description,
          icon: milestone.icon,
        });
        if (achievement) achievements.push(achievement);
      }
    }

    return achievements;
  }

  private static async createAchievement(achievementData: AchievementData) {
    try {
      // Check if achievement already exists
      const existing = await prisma.achievement.findFirst({
        where: {
          userId: achievementData.userId,
          type: achievementData.type,
        },
      });

      if (existing) {
        return null; // Achievement already unlocked
      }

      // Create new achievement
      const achievement = await prisma.achievement.create({
        data: achievementData,
      });

      return achievement;
    } catch (error) {
      console.error("Error creating achievement:", error);
      return null;
    }
  }

  static async getUserAchievements(userId: string) {
    try {
      const achievements = await prisma.achievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: "desc" },
      });
      return achievements;
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      return [];
    }
  }
}
