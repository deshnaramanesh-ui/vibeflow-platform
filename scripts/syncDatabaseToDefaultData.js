const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Playlist = require('../models/Playlist');
const Song = require('../models/Song');

async function sync() {
  await mongoose.connect('mongodb://127.0.0.1:27017/vibeflow_db');
  console.log('Connected to MongoDB.');

  const playlists = await Playlist.find().populate('songs').lean();
  const allSongs = [];

  const processedPlaylists = playlists.map((p) => {
    const songIds = [];
    (p.songs || []).forEach((s) => {
      songIds.push(s._id.toString());
      allSongs.push({
        _id: s._id.toString(),
        title: s.title,
        artist: s.artist,
        album: s.album || `${p.title} Collection`,
        duration: s.duration || 180,
        audioUrl: s.audioUrl || '',
        coverUrl: s.coverUrl || p.coverImage || 'assets/images/study_mix.jpg',
        genre: s.genre || p.category,
        tempoBpm: s.tempoBpm || 80,
      });
    });

    return {
      _id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      description: p.description,
      category: p.category,
      coverImage: p.coverImage,
      isFeatured: p.isFeatured,
      isFocusMode: p.isFocusMode,
      timerDurationMinutes: p.timerDurationMinutes || 0,
      colorGradient: p.colorGradient,
      songs: songIds,
      creator: p.creator || 'VibeFlow Curators',
      likesCount: p.likesCount || 1000,
    };
  });

  const defaultUser = {
    _id: '66c300000000000000000001',
    username: 'student_alex',
    email: 'alex@student.edu',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    starsToday: 0,
    totalStars: 0,
    currentStreak: 0,
    totalFocusMinutes: 0,
    badges: [],
    favorites: [],
    recentlyPlayed: [],
    favoriteSongs: [],
    settings: {
      audioQuality: 'Very High (320kbps)',
      equalizer: 'Lo-Fi Chill',
      crossfadeSeconds: 4,
      gaplessPlayback: true,
      autoPauseOnTimer: true,
      soundChimeEnabled: true,
      dailyStarGoal: 5,
      privateSession: false,
    },
  };

  const fileContent = `// Default seed data for VibeFlow Platform with User's Custom YouTube Catalog

const defaultSongs = ${JSON.stringify(allSongs, null, 2)};

const defaultPlaylists = ${JSON.stringify(processedPlaylists, null, 2)};

const defaultUser = ${JSON.stringify(defaultUser, null, 2)};

module.exports = {
  defaultSongs,
  defaultPlaylists,
  defaultUser,
};
`;

  fs.writeFileSync(path.join(__dirname, '../seed/defaultData.js'), fileContent, 'utf-8');
  console.log('✅ seed/defaultData.js updated with all', allSongs.length, 'custom YouTube songs!');
  process.exit(0);
}

sync().catch((err) => {
  console.error(err);
  process.exit(1);
});
