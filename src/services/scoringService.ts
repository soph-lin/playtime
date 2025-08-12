import prisma from "@/lib/db";
import { calculateSongPoints, calculateCompletionBonuses, calculateTotalPoints } from "@/lib/scoringCalculator";
import { PlayerAttemptsData } from "@/types/scoring";
import { Prisma } from "@prisma/client";

export interface PlayerScoringState {
  playerId: string;
  sessionId: string;
  attempts: PlayerAttemptsData;
  totalPoints: number;
  songsCompleted: number;
  totalGuesses: number;
  sessionStartTime: number;
}

/**
 * Initialize scoring state for a new player
 */
export async function initializePlayerScoring(playerId: string, sessionId: string): Promise<PlayerScoringState> {
  const sessionStartTime = Date.now();

  return {
    playerId,
    sessionId,
    attempts: {},
    totalPoints: 0,
    songsCompleted: 0,
    totalGuesses: 0,
    sessionStartTime,
  };
}

/**
 * Record a guess attempt for a song
 */
export function recordSongAttempt(
  scoringState: PlayerScoringState,
  songId: string,
  isCorrect: boolean,
  currentTime: number
): PlayerScoringState {
  const existingAttempt = scoringState.attempts[songId];

  if (existingAttempt) {
    // Update existing attempt
    existingAttempt.attempts += 1;
    existingAttempt.endTime = currentTime;
    existingAttempt.isCorrect = isCorrect;
  } else {
    // Create new attempt
    scoringState.attempts[songId] = {
      songId,
      attempts: 1,
      startTime: currentTime,
      endTime: currentTime,
      isCorrect,
    };
  }

  scoringState.totalGuesses += 1;

  // If correct, calculate points and mark as completed
  if (isCorrect) {
    const timeSeconds = (currentTime - scoringState.attempts[songId].startTime) / 1000;
    const points = calculateSongPoints(scoringState.attempts[songId].attempts, timeSeconds, true);

    scoringState.totalPoints += points;
    scoringState.songsCompleted += 1;
  }

  return scoringState;
}

/**
 * Calculate completion bonuses for a player
 */
export function calculatePlayerCompletionBonuses(
  scoringState: PlayerScoringState,
  totalSongs: number,
  isFirstToFinish: boolean | null
): { perfectGame: number; speedRun: number; firstToFinish: number } {
  const completionTime = (Date.now() - scoringState.sessionStartTime) / 1000;

  return calculateCompletionBonuses(scoringState.songsCompleted, totalSongs, completionTime, isFirstToFinish);
}

/**
 * Get final scoring summary for a player
 */
export function getPlayerScoringSummary(
  scoringState: PlayerScoringState,
  totalSongs: number,
  isFirstToFinish: boolean | null
): {
  totalPoints: number;
  songsCompleted: number;
  totalGuesses: number;
  accuracy: number;
  averageAttempts: number;
  averageTime: number;
  completionTime: number;
  completionBonuses: { perfectGame: number; speedRun: number; firstToFinish: number };
  finalScore: number;
} {
  const completionBonuses = calculatePlayerCompletionBonuses(scoringState, totalSongs, isFirstToFinish);

  const completionTime = (Date.now() - scoringState.sessionStartTime) / 1000;
  const accuracy = scoringState.totalGuesses > 0 ? scoringState.songsCompleted / scoringState.totalGuesses : 0;

  const totalAttempts = Object.values(scoringState.attempts).reduce((sum, attempt) => sum + attempt.attempts, 0);
  const averageAttempts = scoringState.songsCompleted > 0 ? totalAttempts / scoringState.songsCompleted : 0;

  const finalScore = calculateTotalPoints(scoringState.totalPoints, completionBonuses);

  return {
    totalPoints: scoringState.totalPoints,
    songsCompleted: scoringState.songsCompleted,
    totalGuesses: scoringState.totalGuesses,
    accuracy,
    averageAttempts,
    averageTime: 0, // Average time is no longer tracked in PlayerScoringState
    completionTime,
    completionBonuses,
    finalScore,
  };
}

/**
 * Update player scoring data in database
 */
export async function updatePlayerScoringInDatabase(
  playerId: string,
  scoringState: PlayerScoringState,
  totalSongs: number,
  isFirstToFinish: boolean | null
): Promise<void> {
  const summary = getPlayerScoringSummary(scoringState, totalSongs, isFirstToFinish);
  const completionTime = Math.round(summary.completionTime);

  await prisma.gameSessionPlayer.update({
    where: { id: playerId },
    data: {
      score: summary.finalScore,
      correct: summary.songsCompleted,
      totalGuesses: summary.totalGuesses,
      attempts: scoringState.attempts as unknown as Prisma.InputJsonValue,
      completionTime,
      firstToFinish: isFirstToFinish,
    },
  });
}

/**
 * Check if a game session is completed
 */
export function isGameSessionCompleted(players: Array<{ songsCompleted: number }>, totalSongs: number): boolean {
  return players.some((player) => player.songsCompleted >= totalSongs);
}

/**
 * Determine if a player is first to finish (multiplayer only)
 */
export function isFirstToFinish(
  playerId: string,
  players: Array<{ id: string; songsCompleted: number }>,
  totalSongs: number
): boolean | null {
  // If only one player, firstToFinish doesn't apply
  if (players.length <= 1) {
    return null;
  }

  const currentPlayer = players.find((p) => p.id === playerId);
  if (!currentPlayer || currentPlayer.songsCompleted < totalSongs) {
    return false;
  }

  // Check if any other player completed before this one
  return !players.some((p) => p.id !== playerId && p.songsCompleted >= totalSongs);
}

/**
 * Get leaderboard data for a session
 */
export async function getSessionLeaderboard(sessionId: string): Promise<
  Array<{
    playerId: string;
    nickname: string;
    finalScore: number;
    songsCompleted: number;
    accuracy: number;
    averageAttempts: number;
    averageTime: number;
    completionTime: number;
    firstToFinish: boolean | null;
  }>
> {
  const players = await prisma.gameSessionPlayer.findMany({
    where: { sessionId },
    select: {
      id: true,
      nickname: true,
      score: true,
      correct: true,
      totalGuesses: true,
      attempts: true,
      completionTime: true,
      firstToFinish: true,
    },
  });

  return players
    .map((player) => {
      const attempts = (player.attempts as Record<string, unknown>) || {};

      const totalAttempts = Object.values(attempts).reduce((sum: number, attempt: unknown) => {
        const attemptData = attempt as { attempts: number };
        return sum + attemptData.attempts;
      }, 0);
      const averageAttempts = player.correct > 0 ? totalAttempts / player.correct : 0;

      const accuracy = player.totalGuesses > 0 ? player.correct / player.totalGuesses : 0;

      return {
        playerId: player.id,
        nickname: player.nickname,
        finalScore: player.score,
        songsCompleted: player.correct,
        accuracy,
        averageAttempts,
        averageTime: 0, // Average time is no longer tracked in PlayerScoringState
        completionTime: player.completionTime || 0,
        firstToFinish: player.firstToFinish,
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}
