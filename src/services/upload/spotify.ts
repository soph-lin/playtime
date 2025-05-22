import { UploadService, TrackData } from "./types";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

interface SpotifyTrack {
  track: {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: {
      name: string;
      images: Array<{ url: string }>;
    };
  };
}

interface SpotifyTrackResponse {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
}

async function getSpotifyToken() {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error("Missing Spotify credentials");
  }

  const authUrl = "https://accounts.spotify.com/api/token";
  const headers = {
    Authorization: "Basic " + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
  };
  const data = { grant_type: "client_credentials" };

  const response = await fetch(authUrl, {
    method: "POST",
    headers,
    body: new URLSearchParams(data),
  });

  if (!response.ok) {
    throw new Error("Failed to get Spotify token");
  }

  const json = await response.json();
  return json.access_token;
}

export class SpotifyUploadService implements UploadService {
  async uploadTrack(url: string): Promise<TrackData> {
    const trackId = url.split("/").pop()?.split("?")[0];
    if (!trackId) {
      throw new Error("Invalid track URL");
    }

    const token = await getSpotifyToken();
    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to fetch track from Spotify");
    }

    const trackData: SpotifyTrackResponse = await response.json();
    return {
      spotifyId: trackData.id,
      title: trackData.name,
      artist: trackData.artists[0].name,
      album: trackData.album.name,
      coverUrl: trackData.album.images[0]?.url,
    };
  }

  async uploadPlaylist(url: string): Promise<{ tracks: TrackData[]; playlistName: string }> {
    const playlistId = url.split("/").pop()?.split("?")[0];
    if (!playlistId) {
      throw new Error("Invalid playlist URL");
    }

    const token = await getSpotifyToken();

    // First get playlist details to get the name
    const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!playlistResponse.ok) {
      const errorData = await playlistResponse.json();
      throw new Error(errorData.error?.message || "Failed to fetch playlist from Spotify");
    }

    const playlistData = await playlistResponse.json();
    const playlistName = playlistData.name;

    // Then get the tracks
    const tracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!tracksResponse.ok) {
      const errorData = await tracksResponse.json();
      throw new Error(errorData.error?.message || "Failed to fetch playlist tracks from Spotify");
    }

    const data = await tracksResponse.json();
    const tracks = data.items.map((item: SpotifyTrack) => ({
      spotifyId: item.track.id,
      title: item.track.name,
      artist: item.track.artists[0].name,
      album: item.track.album.name,
      coverUrl: item.track.album.images[0]?.url,
    }));

    return { tracks, playlistName };
  }
}
