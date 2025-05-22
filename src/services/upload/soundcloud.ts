import { TrackData } from "./types";
import { SoundCloudTokenService } from "../soundcloud/token";

const tokenService = SoundCloudTokenService.getInstance();

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Define the SoundCloud API track type
interface SoundCloudApiTrack {
  id: number;
  title: string;
  user: {
    username: string;
    avatar_url: string;
  };
  artwork_url: string | null;
  permalinkUrl: string;
  duration: number;
}

export class SoundCloudSearchService {
  async searchByTitleAndArtist(title: string, artist: string, retryCount = 0): Promise<TrackData | null> {
    try {
      const token = await tokenService.getAccessToken();
      const searchUrl = `https://api.soundcloud.com/tracks?q=${encodeURIComponent(title + " " + artist)}&limit=1&access=playable,preview,blocked`;

      const response = await fetch(searchUrl, {
        headers: {
          Authorization: `OAuth ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("SoundCloud search error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });

        // Check if it's a rate limit error
        if (response.status === 429) {
          if (retryCount < 3) {
            const waitTime = Math.pow(2, retryCount) * 1000;
            console.log(`Rate limit hit while searching, waiting ${waitTime}ms before retry...`);
            await delay(waitTime);
            return this.searchByTitleAndArtist(title, artist, retryCount + 1);
          }
          throw new Error("rate_limit_exceeded");
        }

        throw new Error("Failed to search SoundCloud");
      }

      const searchData = await response.json();
      if (!searchData || searchData.length === 0) {
        return null;
      }

      console.log(searchData);

      const track = searchData[0];
      return {
        spotifyId: "", // This will be set by the upload service
        soundcloudId: track.id.toString(),
        title: track.title,
        artist: track.user.username,
        album: "", // SoundCloud doesn't have album info
        coverUrl: track.artwork_url || track.user.avatar_url,
        permalinkUrl: track.permalink_url,
        duration: track.access === "preview" ? 30000 : track.duration, // Use 30s for preview tracks
        access: track.access || "blocked", // Default to blocked if access is not specified
      };
    } catch (error) {
      if (error instanceof Error && error.message === "rate_limit_exceeded") {
        throw error;
      }
      throw new Error("Failed to search SoundCloud");
    }
  }

  async searchTracks(query: string, limit: number = 3, offset: number = 0, retryCount = 0): Promise<TrackData[]> {
    try {
      const token = await tokenService.getAccessToken();
      const searchUrl = `https://api.soundcloud.com/tracks?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;

      const response = await fetch(searchUrl, {
        headers: {
          Authorization: `OAuth ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("SoundCloud search error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });

        // Check if it's a rate limit error
        if (response.status === 429) {
          if (retryCount < 3) {
            const waitTime = Math.pow(2, retryCount) * 1000;
            console.log(`Rate limit hit while searching, waiting ${waitTime}ms before retry...`);
            await delay(waitTime);
            return this.searchTracks(query, limit, offset, retryCount + 1);
          }
          throw new Error("rate_limit_exceeded");
        }

        throw new Error("Failed to search SoundCloud");
      }

      const searchData = await response.json();
      if (!searchData || searchData.length === 0) {
        return [];
      }

      return searchData.map((track: SoundCloudApiTrack) => ({
        spotifyId: "", // This will be set by the upload service
        soundcloudId: track.id.toString(),
        title: track.title,
        artist: track.user.username,
        album: "", // SoundCloud doesn't have album info
        coverUrl: track.artwork_url || track.user.avatar_url,
        permalinkUrl: track.permalinkUrl,
        duration: track.duration,
      }));
    } catch (error) {
      if (error instanceof Error && error.message === "rate_limit_exceeded") {
        throw error;
      }
      throw new Error("Failed to search SoundCloud");
    }
  }
}
