const express = require('express');
const dataStore = require('../services/dataStore');

const router = express.Router();

// Toggle Favorite Playlist
router.post('/favorites/toggle', async (req, res) => {
  try {
    const { userId, playlistId } = req.body;
    const targetUserId = userId || '66c300000000000000000001';

    const user = await dataStore.findUserById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.favorites) user.favorites = [];

    const pIdStr = playlistId.toString();
    const index = user.favorites.findIndex((id) => id.toString() === pIdStr);

    let isFavorited = false;
    if (index > -1) {
      user.favorites.splice(index, 1);
      isFavorited = false;
    } else {
      user.favorites.push(playlistId);
      isFavorited = true;
    }

    if (user.save) {
      await user.save();
    }

    res.json({
      success: true,
      isFavorited,
      favorites: user.favorites,
      message: isFavorited ? 'Added to favorites!' : 'Removed from favorites.',
    });
  } catch (error) {
    console.error('Favorites toggle error:', error);
    res.status(500).json({ success: false, message: 'Failed to update favorites.' });
  }
});

// Toggle Favorite Song (Liked Songs)
router.post('/favorite-songs/toggle', async (req, res) => {
  try {
    const { userId, song } = req.body;
    const targetUserId = userId || '66c300000000000000000001';

    if (!song) {
      return res.status(400).json({ success: false, message: 'Song object required.' });
    }

    const result = await dataStore.toggleFavoriteSong(targetUserId, song);
    res.json({
      success: true,
      isFavorited: result.isFavorited,
      favoriteSongs: result.favoriteSongs,
      message: result.isFavorited ? '❤️ Added to Liked Songs!' : 'Removed from Liked Songs.',
    });
  } catch (error) {
    console.error('Favorite song toggle error:', error);
    res.status(500).json({ success: false, message: 'Failed to update favorite songs.' });
  }
});

// Get User's Favorite Liked Songs
router.get('/favorite-songs', async (req, res) => {
  try {
    const userId = req.query.userId || '66c300000000000000000001';
    const favoriteSongs = await dataStore.getFavoriteSongs(userId);
    res.json({
      success: true,
      count: favoriteSongs.length,
      favoriteSongs,
    });
  } catch (error) {
    console.error('Favorite songs fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch favorite songs.' });
  }
});

// Record Song in Recently Played History
router.post('/history', async (req, res) => {
  try {
    const { userId, song } = req.body;
    const targetUserId = userId || '66c300000000000000000001';

    if (!song) {
      return res.status(400).json({ success: false, message: 'Song object is required.' });
    }

    const history = await dataStore.recordSongPlayed(targetUserId, song);
    res.json({
      success: true,
      count: history.length,
      recentlyPlayed: history,
    });
  } catch (error) {
    console.error('History record error:', error);
    res.status(500).json({ success: false, message: 'Failed to record history.' });
  }
});

// Get User's Recently Played Songs
router.get('/history', async (req, res) => {
  try {
    const userId = req.query.userId || '66c300000000000000000001';
    const history = await dataStore.getRecentlyPlayed(userId);
    res.json({
      success: true,
      count: history.length,
      recentlyPlayed: history,
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recently played.' });
  }
});

// Get Spotify-Style User Settings
router.get('/settings', async (req, res) => {
  try {
    const userId = req.query.userId || '66c300000000000000000001';
    const settings = await dataStore.getUserSettings(userId);
    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
  }
});

// Update Spotify-Style User Settings
router.post('/settings', async (req, res) => {
  try {
    const { userId, settings } = req.body;
    const targetUserId = userId || '66c300000000000000000001';

    const updated = await dataStore.updateUserSettings(targetUserId, settings || {});
    res.json({
      success: true,
      message: '✅ Settings updated successfully!',
      settings: updated,
    });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
});

module.exports = router;
