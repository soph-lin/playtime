/**
 * Scoring System JSON Data Structures
 *
 * This file documents the JSON structures stored in the database
 * for the new unified scoring system.
 */

/**
 * Individual song attempt data stored in GameSessionPlayer.attempts
 */
export interface SongAttemptData {
  songId: string; // The song being guessed
  attempts: number; // Number of guesses made for this song
  startTime: number; // Timestamp when first guess started (milliseconds)
  endTime: number; // Timestamp when correct guess made (milliseconds)
  isCorrect: boolean; // Whether they eventually got it right
}

/**
 * Complete attempts data structure stored in GameSessionPlayer.attempts
 * Key: songId (unique identifier for each song)
 * Value: SongAttemptData for that song
 */
export interface PlayerAttemptsData {
  [songId: string]: SongAttemptData;
}

/**
 * Scoring breakdown for a single song
 */
export interface SongScoringBreakdown {
  basePoints: number; // Always 100 for correct songs
  attemptBonus: number; // 0-50 based on number of attempts
  timeBonus: number; // 0-25 based on time taken
  totalPoints: number; // Base + attempt + time bonuses
  attemptBonusLabel: string; // Human-readable label (e.g., "Perfect Accuracy")
  timeBonusLabel: string; // Human-readable label (e.g., "Lightning Fast")
}

/**
 * Completion bonus breakdown
 */
export interface CompletionBonuses {
  perfectGame: number; // +200 for completing all songs correctly
  speedRun: number; // +100 for completing under 5 minutes
  firstToFinish: number; // +150 for being first in multiplayer (null for single-player)
}

/**
 * Final player scoring summary
 */
export interface PlayerScoringSummary {
  totalPoints: number; // Points from individual songs
  songsCompleted: number; // Number of songs guessed correctly
  totalGuesses: number; // Total number of guesses made
  accuracy: number; // songsCompleted / totalGuesses ratio
  averageAttempts: number; // Average attempts per completed song
  completionTime: number; // Total time to complete all songs (seconds)
  completionBonuses: CompletionBonuses;
  finalScore: number; // Total points + completion bonuses
}
