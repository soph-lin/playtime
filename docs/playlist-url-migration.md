# Playlist URL Migration Guide

## Overview

This document describes the migration to add `playlist_url` field to the Playlist model, enabling better playlist management and backwards compatibility.

## Changes Made

### 1. Database Schema Update

- Added `playlistUrl` field to the `Playlist` model in `prisma/schema.prisma`
- Field is optional (`String?`) to maintain backwards compatibility
- Maps to `playlist_url` column in the database

### 2. API Updates

- Updated `/api/songs` endpoint to handle playlist URLs
- Added backwards compatibility logic for existing playlists
- Enhanced streaming responses to include playlist URL information

### 3. Service Layer Updates

- Modified `SpotifyUploadService` to return playlist URLs
- Updated type definitions to include playlist URL fields

## Backwards Compatibility

The system automatically handles existing playlists without playlist URLs:

1. **Existing Playlists**: When a playlist is re-uploaded, the system detects existing playlists by name and updates them with the playlist URL
2. **New Playlists**: New playlists are created with the playlist URL field populated
3. **Database**: Existing playlists remain functional with `playlist_url` set to `NULL`

## Migration Steps

### Step 1: Update Database Schema

```bash
# Generate Prisma client with new schema
npx prisma generate

# Push schema changes to database
npx prisma db push
```

### Step 2: Run Migration Script (Optional)

```bash
# Check which playlists need playlist URLs
pnpm run update-playlist-urls
```

### Step 3: Update Existing Playlists

To add playlist URLs to existing playlists:

1. **Re-upload Method** (Recommended):
   - Go to the admin upload interface
   - Re-upload the playlist using the same Spotify URL
   - The system automatically detects and updates existing playlists

2. **Manual Database Update**:
   ```sql
   UPDATE "Playlist"
   SET "playlist_url" = 'https://open.spotify.com/playlist/your_playlist_id'
   WHERE id = 'playlist_uuid';
   ```

## Benefits

1. **Better Playlist Management**: Direct links to original Spotify playlists
2. **Re-upload Support**: Can re-upload playlists to update metadata
3. **Audit Trail**: Track playlist origins and updates
4. **User Experience**: Users can access original playlist sources

## Technical Details

### Database Field

- **Column**: `playlist_url`
- **Type**: `TEXT` (nullable)
- **Index**: No index required (low query frequency)

### API Response Changes

All playlist-related API responses now include:

- `playlistUrl`: The original Spotify playlist URL
- Enhanced progress tracking
- Better error handling

### Type Safety

- Updated TypeScript interfaces
- Prisma client regenerated
- Full type safety maintained

## Testing

After migration:

1. **Build Test**: Ensure the application builds successfully
2. **Upload Test**: Test uploading new playlists
3. **Re-upload Test**: Test re-uploading existing playlists
4. **Database Test**: Verify playlist URLs are stored correctly

## Rollback Plan

If issues arise, the migration can be rolled back:

1. **Remove Field**: Delete the `playlist_url` column
2. **Update Schema**: Remove the field from Prisma schema
3. **Regenerate Client**: Run `npx prisma generate`
4. **Update Code**: Remove playlist URL references

## Support

For issues or questions about this migration:

1. Check the build logs for any compilation errors
2. Verify the database schema is updated correctly
3. Test with a small playlist first
4. Review the backwards compatibility logic
