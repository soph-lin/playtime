import prisma from "@/lib/db";

export class SoundCloudTokenService {
  private static instance: SoundCloudTokenService;
  private cachedToken: string | null = null;
  private tokenExpiry: number | null = null;

  private constructor() {}

  public static getInstance(): SoundCloudTokenService {
    if (!SoundCloudTokenService.instance) {
      SoundCloudTokenService.instance = new SoundCloudTokenService();
    }
    return SoundCloudTokenService.instance;
  }

  async getAccessToken(): Promise<string> {
    console.log("Getting access token...");
    // Check if we have a valid cached token
    if (this.cachedToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      console.log("Using cached token");
      return this.cachedToken;
    }

    // Try to get token from database
    const token = await prisma.soundCloudToken.findFirst({
      orderBy: { createdAt: "desc" },
    });

    console.log("Database token:", token);

    if (token && new Date(token.expiresAt) > new Date() && token.status === "ACTIVE") {
      console.log("Using database token");
      this.cachedToken = token.accessToken;
      this.tokenExpiry = new Date(token.expiresAt).getTime();
      return token.accessToken;
    }

    // If no valid token exists, get a new one
    console.log("No valid token found, refreshing...");
    return this.refreshToken();
  }

  async refreshToken(): Promise<string> {
    console.log("Starting token refresh...");
    try {
      const existingToken = await prisma.soundCloudToken.findFirst({
        orderBy: { createdAt: "desc" },
      });

      console.log("Existing token before refresh:", existingToken);

      // If we have an existing token that's still valid, use it
      if (existingToken && new Date(existingToken.expiresAt) > new Date() && existingToken.status === "ACTIVE") {
        console.log("Using existing valid token");
        this.cachedToken = existingToken.accessToken;
        this.tokenExpiry = new Date(existingToken.expiresAt).getTime();
        return existingToken.accessToken;
      }

      if (existingToken && existingToken.status === "REFRESHING") {
        console.log("Token already refreshing, waiting...");
        // If another instance is already refreshing, wait and check again
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const updatedToken = await prisma.soundCloudToken.findFirst({
          orderBy: { createdAt: "desc" },
        });

        if (updatedToken && updatedToken.status === "ACTIVE" && new Date(updatedToken.expiresAt) > new Date()) {
          console.log("Got refreshed token from another instance");
          this.cachedToken = updatedToken.accessToken;
          this.tokenExpiry = new Date(updatedToken.expiresAt).getTime();
          return updatedToken.accessToken;
        }
      }

      // Mark the token as refreshing
      if (existingToken) {
        console.log("Marking existing token as refreshing");
        await prisma.soundCloudToken.update({
          where: { id: existingToken.id },
          data: { status: "REFRESHING" },
        });
      }

      // Get new token from SoundCloud
      const SOUNDCLOUD_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;
      const SOUNDCLOUD_CLIENT_SECRET = process.env.SOUNDCLOUD_CLIENT_SECRET;

      if (!SOUNDCLOUD_CLIENT_ID || !SOUNDCLOUD_CLIENT_SECRET) {
        console.error("Missing SoundCloud credentials");
        throw new Error("Missing SoundCloud credentials");
      }

      // Only check rate limit when we need to request a new token
      const lastTokenRequest = await prisma.soundCloudToken.findFirst({
        where: {
          status: "ACTIVE",
          createdAt: {
            gt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (lastTokenRequest) {
        console.log("Rate limit hit for new token request");
        throw new Error("Rate limit exceeded: Please wait before requesting a new token");
      }

      console.log("Requesting new token from SoundCloud...");
      const authUrl = "https://api.soundcloud.com/oauth2/token";
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
      };

      const params = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: SOUNDCLOUD_CLIENT_ID,
        client_secret: SOUNDCLOUD_CLIENT_SECRET,
      });

      const response = await fetch(authUrl, {
        method: "POST",
        headers,
        body: params,
      });

      if (!response.ok) {
        console.error("SoundCloud token response not OK:", response.status, response.statusText);
        if (response.status === 429) {
          // Rate limit exceeded - mark the token as failed
          if (existingToken) {
            await prisma.soundCloudToken.update({
              where: { id: existingToken.id },
              data: { status: "FAILED" },
            });
          }
          throw new Error("Rate limit exceeded: Please wait before requesting a new token");
        }
        throw new Error("Failed to get SoundCloud access token");
      }

      const tokenData = await response.json();
      console.log("Got token data from SoundCloud");
      if (!tokenData.access_token) {
        console.error("No access token in response");
        throw new Error("Invalid token response from SoundCloud");
      }

      // Calculate expiry time (default to 1 hour if not provided)
      const expiresIn = tokenData.expires_in || 3600;

      console.log("Creating/updating token in database...");
      // Update the existing token or create a new one if none exists
      const updatedToken = existingToken
        ? await prisma.soundCloudToken.update({
            where: { id: existingToken.id },
            data: {
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token || null,
              expiresAt: new Date(Date.now() + expiresIn * 1000),
              status: "ACTIVE",
            },
          })
        : await prisma.soundCloudToken.create({
            data: {
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token || null,
              expiresAt: new Date(Date.now() + expiresIn * 1000),
              status: "ACTIVE",
            },
          });

      console.log("Token created/updated in database:", updatedToken);

      // Update cache
      this.cachedToken = updatedToken.accessToken;
      this.tokenExpiry = updatedToken.expiresAt.getTime();

      return updatedToken.accessToken;
    } catch (error) {
      console.error("Error in refreshToken:", error);
      // If there was an error, mark the token as failed
      const existingToken = await prisma.soundCloudToken.findFirst({
        orderBy: { createdAt: "desc" },
      });

      if (existingToken) {
        await prisma.soundCloudToken.update({
          where: { id: existingToken.id },
          data: { status: "FAILED" },
        });
      }

      throw error;
    }
  }
}
