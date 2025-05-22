import { SOUNDCLOUD_CLIENT_ID, SOUNDCLOUD_API_URL } from "@/config/constants";
import { SoundCloudTokenService } from "@/services/soundcloud/token";
import { SearchResponse } from "@/app/api/soundcloud/types";

class SoundCloudClient {
  private clientId: string;
  private baseUrl: string;
  private tokenService: SoundCloudTokenService;

  constructor() {
    this.clientId = SOUNDCLOUD_CLIENT_ID;
    this.baseUrl = SOUNDCLOUD_API_URL;
    this.tokenService = SoundCloudTokenService.getInstance();
  }

  async search(query: string, limit: number = 10, offset: number = 0): Promise<SearchResponse> {
    try {
      const token = await this.tokenService.getAccessToken();
      const response = await fetch(
        `${this.baseUrl}/tracks?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `OAuth ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      // SoundCloud API returns an array of tracks directly
      return {
        collection: data || [],
      };
    } catch (error) {
      console.error("SoundCloud search error:", error);
      throw error;
    }
  }

  async getTrack(trackId: string) {
    try {
      const token = await this.tokenService.getAccessToken();
      const response = await fetch(`${this.baseUrl}/tracks/${trackId}`, {
        headers: {
          Authorization: `OAuth ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch track");
      }

      return response.json();
    } catch (error) {
      console.error("SoundCloud track fetch error:", error);
      throw error;
    }
  }
}

export const soundCloudClient = new SoundCloudClient();
