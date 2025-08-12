import { SCORING_CONSTANTS, XP_CONSTANTS, getLevelMultiplier } from "@/constants/scoring";
import { SongScoringBreakdown, CompletionBonuses } from "@/types/scoring";

/**
 * Calculate points for a single song based on attempts and time
 */
export function calculateSongPoints(attempts: number, timeSeconds: number, isCorrect: boolean): number {
  if (!isCorrect) return 0;

  const basePoints = SCORING_CONSTANTS.BASE_POINTS_PER_SONG;
  const attemptBonus = calculateAttemptBonus(attempts);
  const timeBonus = calculateTimeBonus(timeSeconds);

  return basePoints + attemptBonus + timeBonus;
}

/**
 * Calculate attempt-based bonus points (0-50)
 */
function calculateAttemptBonus(attempts: number): number {
  if (attempts === 1) return SCORING_CONSTANTS.ATTEMPT_BONUSES.FIRST_ATTEMPT;
  if (attempts === 2) return SCORING_CONSTANTS.ATTEMPT_BONUSES.SECOND_ATTEMPT;
  if (attempts === 3) return SCORING_CONSTANTS.ATTEMPT_BONUSES.THIRD_ATTEMPT;
  return SCORING_CONSTANTS.ATTEMPT_BONUSES.FOURTH_PLUS;
}

/**
 * Calculate time-based bonus points (0-25)
 */
function calculateTimeBonus(timeSeconds: number): number {
  if (timeSeconds <= SCORING_CONSTANTS.TIME_THRESHOLDS.LIGHTNING_FAST) {
    return SCORING_CONSTANTS.TIME_BONUSES.LIGHTNING_FAST;
  } else if (timeSeconds <= SCORING_CONSTANTS.TIME_THRESHOLDS.VERY_FAST) {
    return SCORING_CONSTANTS.TIME_BONUSES.VERY_FAST;
  } else if (timeSeconds <= SCORING_CONSTANTS.TIME_THRESHOLDS.FAST) {
    return SCORING_CONSTANTS.TIME_BONUSES.FAST;
  } else if (timeSeconds <= SCORING_CONSTANTS.TIME_THRESHOLDS.MODERATE) {
    return SCORING_CONSTANTS.TIME_BONUSES.MODERATE;
  } else {
    return SCORING_CONSTANTS.TIME_BONUSES.SLOW;
  }
}

/**
 * Calculate experience points for a single song
 */
export function calculateSongXP(
  attempts: number,
  timeSeconds: number,
  isCorrect: boolean,
  playerLevel: number
): number {
  if (!isCorrect) return 0;

  const baseXP = XP_CONSTANTS.BASE_XP_PER_SONG;
  const attemptBonus = calculateAttemptXPBonus(attempts);
  const timeBonus = calculateTimeXPBonus(timeSeconds);
  const levelMultiplier = getLevelMultiplier(playerLevel);

  const totalXP = (baseXP + attemptBonus + timeBonus) * levelMultiplier;
  return Math.round(totalXP);
}

/**
 * Calculate attempt-based XP bonus (0-15)
 */
function calculateAttemptXPBonus(attempts: number): number {
  if (attempts === 1) return XP_CONSTANTS.ATTEMPT_XP_BONUSES.FIRST_ATTEMPT;
  if (attempts === 2) return XP_CONSTANTS.ATTEMPT_XP_BONUSES.SECOND_ATTEMPT;
  if (attempts === 3) return XP_CONSTANTS.ATTEMPT_XP_BONUSES.THIRD_ATTEMPT;
  return XP_CONSTANTS.ATTEMPT_XP_BONUSES.FOURTH_PLUS;
}

/**
 * Calculate time-based XP bonus (0-10)
 */
function calculateTimeXPBonus(timeSeconds: number): number {
  if (timeSeconds <= SCORING_CONSTANTS.TIME_THRESHOLDS.LIGHTNING_FAST) {
    return XP_CONSTANTS.TIME_XP_BONUSES.LIGHTNING_FAST;
  } else if (timeSeconds <= SCORING_CONSTANTS.TIME_THRESHOLDS.VERY_FAST) {
    return XP_CONSTANTS.TIME_XP_BONUSES.VERY_FAST;
  } else if (timeSeconds <= SCORING_CONSTANTS.TIME_THRESHOLDS.FAST) {
    return XP_CONSTANTS.TIME_XP_BONUSES.FAST;
  } else if (timeSeconds <= SCORING_CONSTANTS.TIME_THRESHOLDS.MODERATE) {
    return XP_CONSTANTS.TIME_XP_BONUSES.MODERATE;
  } else {
    return XP_CONSTANTS.TIME_XP_BONUSES.SLOW;
  }
}

/**
 * Calculate completion bonuses for a player
 */
export function calculateCompletionBonuses(
  songsCompleted: number,
  totalSongs: number,
  completionTime: number,
  isFirstToFinish: boolean | null
): CompletionBonuses {
  const perfectGame = songsCompleted === totalSongs ? SCORING_CONSTANTS.COMPLETION_BONUSES.PERFECT_GAME : 0;
  const speedRun =
    completionTime <= SCORING_CONSTANTS.SPEED_RUN_THRESHOLD ? SCORING_CONSTANTS.COMPLETION_BONUSES.SPEED_RUN : 0;
  // Only award firstToFinish bonus if it's a multiplayer game and player was first
  const firstToFinish = isFirstToFinish === true ? SCORING_CONSTANTS.COMPLETION_BONUSES.FIRST_TO_FINISH : 0;

  return { perfectGame, speedRun, firstToFinish };
}

/**
 * Calculate total points including completion bonuses
 */
export function calculateTotalPoints(songPoints: number, completionBonuses: CompletionBonuses): number {
  return songPoints + completionBonuses.perfectGame + completionBonuses.speedRun + completionBonuses.firstToFinish;
}

/**
 * Get scoring breakdown for display purposes
 */
export function getScoringBreakdown(attempts: number, timeSeconds: number, isCorrect: boolean): SongScoringBreakdown {
  if (!isCorrect) {
    return {
      basePoints: 0,
      attemptBonus: 0,
      timeBonus: 0,
      totalPoints: 0,
      attemptBonusLabel: "Incorrect",
      timeBonusLabel: "Incorrect",
    };
  }

  const basePoints = SCORING_CONSTANTS.BASE_POINTS_PER_SONG;
  const attemptBonus = calculateAttemptBonus(attempts);
  const timeBonus = calculateTimeBonus(timeSeconds);
  const totalPoints = basePoints + attemptBonus + timeBonus;

  const attemptBonusLabel = getAttemptBonusLabel(attempts);
  const timeBonusLabel = getTimeBonusLabel(timeSeconds);

  return {
    basePoints,
    attemptBonus,
    timeBonus,
    totalPoints,
    attemptBonusLabel,
    timeBonusLabel,
  };
}

/**
 * Get human-readable label for attempt bonus
 */
function getAttemptBonusLabel(attempts: number): string {
  if (attempts === 1) return "Perfect Accuracy";
  if (attempts === 2) return "Good Accuracy";
  if (attempts === 3) return "Acceptable Accuracy";
  return "No Accuracy Bonus";
}

/**
 * Get human-readable label for time bonus
 */
function getTimeBonusLabel(timeSeconds: number): string {
  if (timeSeconds <= SCORING_CONSTANTS.TIME_THRESHOLDS.LIGHTNING_FAST) return "Lightning Fast";
  if (timeSeconds <= SCORING_CONSTANTS.TIME_THRESHOLDS.VERY_FAST) return "Very Fast";
  if (timeSeconds <= SCORING_CONSTANTS.TIME_THRESHOLDS.FAST) return "Fast";
  if (timeSeconds <= SCORING_CONSTANTS.TIME_THRESHOLDS.MODERATE) return "Moderate";
  return "No Time Bonus";
}
