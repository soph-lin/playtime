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
  playlistId?: string;
  playlistCreated?: boolean;
}

export interface HistoryEntry {
  id: string;
  title: string;
  artist: string;
  status: "uploading_playlist" | "uploading_track" | "song_added" | "song_failed" | "already_added";
  message: string;
  error?: {
    step: "spotify" | "soundcloud" | "database";
    message: string;
  };
  timestamp: string;
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
