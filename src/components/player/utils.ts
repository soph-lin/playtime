/**
 * Format time in milliseconds to mm:ss format
 *
 * @param ms - Time in milliseconds
 * @returns Formatted time string (mm:ss)
 */
export const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Calculate progress percentage based on current time and duration
 *
 * @param currentTime - Current time in milliseconds
 * @param duration - Total duration in milliseconds
 * @returns Progress percentage (0-100)
 */
export const calculateProgress = (currentTime: number, duration: number): number => {
  if (!duration) return 0;
  return Math.min((currentTime / duration) * 100, 100);
};
