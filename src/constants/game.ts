export const GAME_CONFIG = {
  MAX_PLAYERS: 8,
  ROUND_DURATION: 30, // seconds
  MAX_NICKNAME_LENGTH: 20,
  MIN_NICKNAME_LENGTH: 2,
  ALLOWED_NICKNAME_CHARS: /^[a-zA-Z0-9\s\-_]+$/, // letters, numbers, spaces, hyphens, underscores
} as const;

export const GAME_STATUS = {
  WAITING: "waiting",
  ACTIVE: "active",
  COMPLETED: "completed",
} as const;

export type GameStatus = (typeof GAME_STATUS)[keyof typeof GAME_STATUS];
