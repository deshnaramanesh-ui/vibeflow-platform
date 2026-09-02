const express = require('express');
const dataStore = require('../services/dataStore');

const router = express.Router();

// Get all playlists (Featured & All categories)
router.get('/', async (req, res) => {
  try {
    const playlists = await dataStore.getAllPlaylists();
    res.json({
      success: true,
      count: playlists.length,
      playlists,
    });
  } catch (error) {
    console.error('Fetch playlists error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch playlists.' });
  }
});

// Search songs across all playlists
router.get('/search/songs', async (req, res) => {
  try {
    const { q } = req.query;
    const songs = await dataStore.searchSongs(q);
    res.json({
      success: true,
      count: songs.length,
      songs,
    });
  } catch (error) {
    console.error('Search songs error:', error);
    res.status(500).json({ success: false, message: 'Failed to search songs.' });
  }
});

// Add a custom song to a specific playlist
router.post('/:id/songs', async (req, res) => {
  try {
    const { title, artist, album, duration, audioUrl, coverUrl, genre } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ success: false, message: 'Song title and artist are required.' });
    }

    const playlist = await dataStore.getPlaylistById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found.' });
    }

    const defaultCover = playlist.coverImage || 'assets/images/study_mix.jpg';
    const defaultAudio = 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3';

    const newSongData = {
      title: title.trim(),
      artist: artist.trim(),
      album: album ? album.trim() : `${playlist.title} Collection`,
      duration: Number(duration) || 180,
      audioUrl: audioUrl && audioUrl.trim() ? audioUrl.trim() : defaultAudio,
      coverUrl: coverUrl && coverUrl.trim() ? coverUrl.trim() : defaultCover,
      genre: genre || playlist.category,
      tempoBpm: 80,
    };

    const result = await dataStore.addSongToPlaylist(playlist._id || req.params.id, newSongData);

    res.status(201).json({
      success: true,
      message: `🎵 Added "${newSongData.title}" to ${playlist.title}!`,
      song: result.newSong,
      playlist: result.playlist,
    });
  } catch (error) {
    console.error('Add song error:', error);
    res.status(500).json({ success: false, message: 'Failed to add song to playlist.' });
  }
});

// Get playlist by ID or slug
router.get('/:id', async (req, res) => {
  try {
    const playlist = await dataStore.getPlaylistById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found.' });
    }
    res.json({
      success: true,
      playlist,
    });
  } catch (error) {
    console.error('Fetch playlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch playlist details.' });
  }
});

// Delete a song from a playlist
router.delete('/:id/songs/:songId', async (req, res) => {
  try {
    const { id, songId } = req.params;
    const updatedPlaylist = await dataStore.removeSongFromPlaylist(id, songId);

    if (!updatedPlaylist) {
      return res.status(404).json({ success: false, message: 'Playlist not found.' });
    }

    res.json({
      success: true,
      message: '🗑️ Song removed from playlist successfully.',
      playlist: updatedPlaylist,
    });
  } catch (error) {
    console.error('Delete song error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove song.' });
  }
});

module.exports = router;
