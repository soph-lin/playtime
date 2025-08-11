-- Add playlist_url column to Playlist table
ALTER TABLE "Playlist" ADD COLUMN "playlist_url" TEXT;

-- Update existing playlists to have a default value (optional)
-- This ensures backwards compatibility for existing playlists
UPDATE "Playlist" SET "playlist_url" = NULL WHERE "playlist_url" IS NULL;
