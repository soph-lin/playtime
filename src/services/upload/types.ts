export interface TrackData {
  spotifyId: string;
  soundcloudId?: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  permalinkUrl?: string;
  duration?: number;
  access?: "playable" | "preview" | "blocked";
}

export interface UploadService {
  uploadTrack(url: string): Promise<TrackData>;
  uploadPlaylist(url: string): Promise<{ tracks: TrackData[]; playlistName: string }>;
}

export interface UploadResponse {
  message: string;
  songs: {
    id: string;
    title: string;
    artist: string;
    status: "success" | "failed" | "already_added";
    error?: {
      step: "spotify" | "soundcloud" | "database";
      message: string;
    };
  }[];
  progress: {
    processed: number;
    total: number;
  };
  playlistName?: string;
}

export interface HistoryEntry {
  action: "uploading_playlist" | "uploading_track" | "song_added" | "song_failed";
  message: string;
  timestamp: Date;
}

export interface SearchService {
  searchByTitleAndArtist(
    title: string,
    artist: string
  ): Promise<{
    soundcloudId: string;
    permalinkUrl: string;
    duration: number;
  } | null>;
}
