const express = require('express');
const dataStore = require('../services/dataStore');

const router = express.Router();

// Complete a Focus Session (Study Mix) & Award Stars
router.post('/complete-session', async (req, res) => {
  try {
    const { userId, durationMinutes, playlistId } = req.body;

    const targetUserId = userId || '66c300000000000000000001';
    const minutes = Number(durationMinutes) || 30;

    const result = await dataStore.recordFocusSession(targetUserId, minutes, playlistId);

    res.json({
      success: true,
      message: `🎉 Great work! You completed a ${minutes}-minute study session and earned ${result.starsEarned} ⭐ Star!`,
      starsEarned: result.starsEarned,
      user: {
        starsToday: result.user.starsToday,
        totalStars: result.user.totalStars,
        currentStreak: result.user.currentStreak,
        totalFocusMinutes: result.user.totalFocusMinutes,
        badges: result.user.badges,
      },
      session: result.session,
    });
  } catch (error) {
    console.error('Focus session error:', error);
    res.status(500).json({ success: false, message: 'Failed to record focus session.' });
  }
});

// Get Student Focus Analytics & Streak Dashboard Data
router.get('/stats/:userId', async (req, res) => {
  try {
    const userId = req.params.userId || '66c300000000000000000001';
    const stats = await dataStore.getUserFocusStats(userId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Get focus stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve focus statistics.' });
  }
});

// Demo Fast Reward Trigger (Instantly grants +1 Star for easy live presentation demo)
router.post('/demo-reward', async (req, res) => {
  try {
    const userId = req.body.userId || '66c300000000000000000001';
    const result = await dataStore.recordFocusSession(userId, 30, '66b200000000000000000001');

    res.json({
      success: true,
      message: 'Demo focus milestone reached: +1 ⭐ Star awarded!',
      starsEarned: 1,
      user: {
        starsToday: result.user.starsToday,
        totalStars: result.user.totalStars,
        currentStreak: result.user.currentStreak,
        totalFocusMinutes: result.user.totalFocusMinutes,
        badges: result.user.badges,
      },
    });
  } catch (error) {
    console.error('Demo reward error:', error);
    res.status(500).json({ success: false, message: 'Failed to trigger demo reward.' });
  }
});

// Reset Stars & Streak (for testing starting from 0)
router.post('/reset-stars', async (req, res) => {
  try {
    const userId = req.body.userId || '66c300000000000000000001';
    const user = await dataStore.resetUserStars(userId);

    res.json({
      success: true,
      message: 'Stars & streak reset to 0. Ready to earn fresh stars!',
      user: {
        starsToday: 0,
        totalStars: 0,
        currentStreak: 0,
        totalFocusMinutes: 0,
        badges: user ? user.badges : [],
      },
    });
  } catch (error) {
    console.error('Reset stars error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset stars.' });
  }
});

module.exports = router;
