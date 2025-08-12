// Game Scoring System Constants
// Based on the unified scoring system design

export const SCORING_CONSTANTS = {
  // Base points per correct song
  BASE_POINTS_PER_SONG: 100,

  // Attempt-based bonus points (0-50 total)
  ATTEMPT_BONUSES: {
    FIRST_ATTEMPT: 50,   // Perfect accuracy
    SECOND_ATTEMPT: 25,  // Good accuracy
    THIRD_ATTEMPT: 10,   // Acceptable accuracy
    FOURTH_PLUS: 0,      // No accuracy bonus
  },

  // Time-based bonus points (0-25 total)
  TIME_BONUSES: {
    LIGHTNING_FAST: 25,  // 0-5 seconds
    VERY_FAST: 15,       // 6-15 seconds
    FAST: 10,            // 16-30 seconds
    MODERATE: 5,         // 31-60 seconds
    SLOW: 0,             // 60+ seconds
  },

  // Time thresholds for bonuses (in seconds)
  TIME_THRESHOLDS: {
    LIGHTNING_FAST: 5,
    VERY_FAST: 15,
    FAST: 30,
    MODERATE: 60,
  },

  // Completion bonuses
  COMPLETION_BONUSES: {
    PERFECT_GAME: 200,   // All songs correct
    SPEED_RUN: 100,      // Complete under 5 minutes
    FIRST_TO_FINISH: 150, // First player to complete (multiplayer)
  },

  // Speed run threshold (5 minutes in seconds)
  SPEED_RUN_THRESHOLD: 300,
} as const;

// Experience Points Constants (separate from game points)
export const XP_CONSTANTS = {
  // Base XP per song
  BASE_XP_PER_SONG: 25,

  // Attempt-based XP bonuses (0-15 total)
  ATTEMPT_XP_BONUSES: {
    FIRST_ATTEMPT: 15,
    SECOND_ATTEMPT: 10,
    THIRD_ATTEMPT: 5,
    FOURTH_PLUS: 0,
  },

  // Time-based XP bonuses (0-10 total)
  TIME_XP_BONUSES: {
    LIGHTNING_FAST: 10,
    VERY_FAST: 8,
    FAST: 5,
    MODERATE: 3,
    SLOW: 0,
  },

  // Level multipliers for XP
  LEVEL_MULTIPLIERS: {
    BEGINNER: 1.0,    // Level 1-10
    INTERMEDIATE: 1.1, // Level 11-25
    ADVANCED: 1.2,    // Level 26-50
    EXPERT: 1.5,      // Level 51+
  },

  // Level thresholds
  LEVEL_THRESHOLDS: {
    INTERMEDIATE: 11,
    ADVANCED: 26,
    EXPERT: 51,
  },
} as const;

// Types for scoring data
export interface SongScoringData {
  songId: string;
  attempts: number;
  timeSeconds: number;
  isCorrect: boolean;
  points: number;
  xp: number;
}

export interface PlayerScoringData {
  playerId: string;
  totalPoints: number;
  totalXP: number;
  songsCompleted: number;
  perfectSongs: number;
  averageAttempts: number;
  averageTime: number;
  completionTime?: number;
  firstToFinish: boolean;
}

// Helper function to get level multiplier
export function getLevelMultiplier(level: number): number {
  if (level >= XP_CONSTANTS.LEVEL_THRESHOLDS.EXPERT) {
    return XP_CONSTANTS.LEVEL_MULTIPLIERS.EXPERT;
  } else if (level >= XP_CONSTANTS.LEVEL_THRESHOLDS.ADVANCED) {
    return XP_CONSTANTS.LEVEL_MULTIPLIERS.ADVANCED;
  } else if (level >= XP_CONSTANTS.LEVEL_THRESHOLDS.INTERMEDIATE) {
    return XP_CONSTANTS.LEVEL_MULTIPLIERS.INTERMEDIATE;
  } else {
    return XP_CONSTANTS.LEVEL_MULTIPLIERS.BEGINNER;
  }
}
