export interface SoundCloudWidget {
  bind(event: string, callback: () => void): void;
  unbind(event: string): void;
  play(): void;
  pause(): void;
  seekTo(milliseconds: number): void;
  getPosition(callback: (position: number) => void): void;
  getDuration(callback: (duration: number) => void): void;
  getCurrentSound(callback: (sound: { duration: number }) => void): void;
  isPaused(callback: (paused: boolean) => void): void;
}

export interface SoundCloudEvents {
  READY: string;
  PLAY: string;
  PAUSE: string;
  FINISH: string;
  SEEK: string;
  PLAY_PROGRESS: string;
}

declare global {
  interface Window {
    SC: {
      Widget: {
        Events: SoundCloudEvents;
        (iframe: HTMLIFrameElement): SoundCloudWidget;
      };
    };
  }
}
