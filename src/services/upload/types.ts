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
  uploadPlaylist(url: string): Promise<{ tracks: TrackData[]; playlistName: string; playlistUrl: string }>;
  uploadAlbum(url: string): Promise<{ tracks: TrackData[]; playlistName: string }>;
}

// New streaming response types
export interface StreamingUploadResponse {
  type: "progress" | "processing" | "song_result" | "complete" | "error";
  message?: string;
  songs?: {
    id: string;
    title: string;
    artist: string;
    status: "success" | "failed" | "already_added";
    error?: {
      step: "spotify" | "soundcloud" | "database";
      message: string;
    };
  }[];
  song?: {
    id: string;
    title: string;
    artist: string;
    status: "success" | "failed" | "already_added" | "processing";
    error?: {
      step: "spotify" | "soundcloud" | "database";
      message: string;
    };
  };
  track?: {
    id: string;
    title: string;
    artist: string;
    status: "processing";
  };
  progress?: {
    processed: number;
    total: number;
  };
  playlistName?: string;
  playlistId?: string;
  playlistCreated?: boolean;
  playlistUrl?: string;
  error?: string;
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
  playlistUrl?: string;
}

export interface HistoryEntry {
  id: string;
  title: string;
  artist: string;
  status: "uploading_playlist" | "uploading_track" | "song_added" | "song_failed" | "already_added" | "processing";
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
