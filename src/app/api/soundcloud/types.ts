export interface SoundCloudTrack {
  id: string;
  title: string;
  permalinkUrl: string;
  artworkUrl?: string;
  duration?: number;
  user?: {
    username: string;
  };
  access?: string;
}

export interface SearchResponse {
  collection: SoundCloudTrack[];
}
