export const LOADING_SPLASH_MESSAGES = [
  "Tuning the instruments",
  "Warming up the speakers",
  "Loading the rhythm",
  "Preparing the melody",
  "Setting up the stage",
  "Getting the groove ready",
  "Spinning up the turntables",
  "Calibrating the sound",
  "Loading the playlist",
  "Preparing the performance",
  "Setting the tempo",
  "Loading the harmony",
  "Getting the beat ready",
  "Preparing the soundtrack",
  "Loading the music",
  "Setting up the concert",
  "Preparing the show",
  "Loading the sound",
  "Getting ready to rock",
  "Preparing the jam session",
] as const;

export type LoadingSplashMessage = (typeof LOADING_SPLASH_MESSAGES)[number];

export const getRandomSplashMessage = (): LoadingSplashMessage => {
  const randomIndex = Math.floor(Math.random() * LOADING_SPLASH_MESSAGES.length);
  return LOADING_SPLASH_MESSAGES[randomIndex];
};
