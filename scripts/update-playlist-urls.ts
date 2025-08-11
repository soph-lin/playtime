#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * This script updates existing playlists with playlist URLs when they are re-uploaded.
 * It's designed to be run after the playlist_url field has been added to the database.
 * 
 * Usage: npx tsx scripts/update-playlist-urls.ts
 */

async function updatePlaylistUrls() {
  try {
    console.log('🔍 Finding playlists without playlist_url...');
    
    // Find all playlists that don't have a playlist_url set
    const playlistsWithoutUrl = await prisma.playlist.findMany({
      where: {
        playlistUrl: null,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    console.log(`📊 Found ${playlistsWithoutUrl.length} playlists without playlist_url`);

    if (playlistsWithoutUrl.length === 0) {
      console.log('✅ All playlists already have playlist_url set');
      return;
    }

    console.log('\n📝 Playlists without playlist_url:');
    playlistsWithoutUrl.forEach((playlist, index) => {
      console.log(`${index + 1}. ${playlist.name} (ID: ${playlist.id}) - Created: ${playlist.createdAt.toISOString()}`);
    });

    console.log('\n💡 To update these playlists with playlist URLs:');
    console.log('1. Re-upload the playlist using the admin upload interface');
    console.log('2. The system will automatically detect existing playlists by name and update them');
    console.log('3. This ensures backwards compatibility while adding the new playlist_url field');

    console.log('\n🔧 Manual update option:');
    console.log('You can also manually update specific playlists using:');
    console.log('UPDATE "Playlist" SET "playlist_url" = \'your_playlist_url\' WHERE id = \'playlist_id\';');

  } catch (error) {
    console.error('❌ Error updating playlist URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updatePlaylistUrls()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
