// Universal Data Store: handles MongoDB operations with in-memory fallback
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const Song = require('../models/Song');
const FocusSession = require('../models/FocusSession');
const { getStatus } = require('../config/db');
const { defaultSongs, defaultPlaylists, defaultUser } = require('../seed/defaultData');

// In-Memory state for standalone fallback mode
let memorySongs = JSON.parse(JSON.stringify(defaultSongs));
let memoryPlaylists = JSON.parse(JSON.stringify(defaultPlaylists));
let memoryUsers = [JSON.parse(JSON.stringify(defaultUser))];
let memorySessions = [
  {
    _id: '66d400000000000000000001',
    userId: '66c300000000000000000001',
    playlistId: '66b200000000000000000001',
    durationMinutes: 30,
    starsEarned: 1,
    completedSuccessfully: true,
    sessionDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    notes: 'Study Mix Pomodoro completed',
  },
];

const dataStore = {
  // Playlists
  async getAllPlaylists() {
    if (getStatus()) {
      try {
        const playlists = await Playlist.find().populate('songs').lean();
        if (playlists && playlists.length > 0) return playlists;
      } catch (err) {
        console.error('Mongo error in getAllPlaylists:', err.message);
      }
    }
    // Fallback: Populate memory songs into memory playlists
    return memoryPlaylists.map((p) => ({
      ...p,
      songs: (p.songs || []).map((songId) =>
        typeof songId === 'object' ? songId : (memorySongs.find((s) => s._id.toString() === songId.toString()) || songId)
      ),
    }));
  },

  async getPlaylistById(id) {
    const idStr = (id || '').toString();
    if (getStatus()) {
      try {
        let playlist;
        if (idStr.match(/^[0-9a-fA-F]{24}$/)) {
          playlist = await Playlist.findById(idStr).populate('songs').lean();
        } else {
          playlist = await Playlist.findOne({ slug: idStr }).populate('songs').lean();
        }
        if (playlist) return playlist;
      } catch (err) {
        // Continue to fallback
      }
    }
    const found = memoryPlaylists.find(
      (p) => p._id.toString() === idStr || p.slug === idStr
    );
    if (!found) return null;
    return {
      ...found,
      songs: (found.songs || []).map((songId) =>
        typeof songId === 'object' ? songId : (memorySongs.find((s) => s._id.toString() === songId.toString()) || songId)
      ),
    };
  },

  // Songs
  async getAllSongs() {
    if (getStatus()) {
      try {
        const songs = await Song.find().lean();
        if (songs && songs.length > 0) return songs;
      } catch (err) {
        console.error('Mongo error in getAllSongs:', err.message);
      }
    }
    return memorySongs;
  },

  async createSong(songData) {
    let created = null;
    if (getStatus()) {
      try {
        created = await Song.create(songData);
      } catch (err) {
        console.error('Mongo error in createSong:', err.message);
      }
    }
    if (!created) {
      created = {
        _id: '66a100000000000000' + Math.floor(100000 + Math.random() * 900000),
        duration: 180,
        genre: 'Custom / Student Beats',
        tempoBpm: 80,
        ...songData,
      };
      memorySongs.push(created);
    }
    return created;
  },

  async addSongToPlaylist(playlistId, songData) {
    const newSong = await this.createSong(songData);
    const pIdStr = (playlistId || '').toString();
    
    if (getStatus()) {
      try {
        let playlist;
        if (pIdStr.match(/^[0-9a-fA-F]{24}$/)) {
          playlist = await Playlist.findById(pIdStr);
        } else {
          playlist = await Playlist.findOne({ slug: pIdStr });
        }
        if (playlist) {
          playlist.songs.push(newSong._id);
          await playlist.save();
          return { playlist, newSong };
        }
      } catch (err) {
        console.error('Mongo error in addSongToPlaylist:', err.message);
      }
    }

    // Memory fallback
    const memPlaylist = memoryPlaylists.find(
      (p) => p._id.toString() === pIdStr || p.slug === pIdStr
    );
    if (memPlaylist) {
      if (!memPlaylist.songs) memPlaylist.songs = [];
      memPlaylist.songs.push(newSong._id);
    }
    return { playlist: memPlaylist, newSong };
  },

  async removeSongFromPlaylist(playlistId, songId) {
    const pIdStr = (playlistId || '').toString();
    const sIdStr = (songId || '').toString();

    if (getStatus()) {
      try {
        let playlist;
        if (pIdStr.match(/^[0-9a-fA-F]{24}$/)) {
          playlist = await Playlist.findById(pIdStr);
        } else {
          playlist = await Playlist.findOne({ slug: pIdStr });
        }

        if (playlist) {
          playlist.songs = playlist.songs.filter(
            (s) => (typeof s === 'object' ? s._id : s).toString() !== sIdStr
          );
          await playlist.save();

          if (sIdStr.match(/^[0-9a-fA-F]{24}$/)) {
            await Song.findByIdAndDelete(sIdStr);
          }
          return playlist;
        }
      } catch (err) {
        console.error('Mongo error in removeSongFromPlaylist:', err.message);
      }
    }

    // Memory fallback
    const memPlaylist = memoryPlaylists.find(
      (p) => p._id.toString() === pIdStr || p.slug === pIdStr
    );
    if (memPlaylist && memPlaylist.songs) {
      memPlaylist.songs = memPlaylist.songs.filter(
        (s) => (typeof s === 'object' ? s._id : s).toString() !== sIdStr
      );
    }
    memorySongs = memorySongs.filter((s) => s._id.toString() !== sIdStr);
    return memPlaylist;
  },

  async searchSongs(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return this.getAllSongs();
    
    if (getStatus()) {
      try {
        const regex = new RegExp(q, 'i');
        const songs = await Song.find({
          $or: [{ title: regex }, { artist: regex }, { genre: regex }, { album: regex }],
        }).lean();
        return songs;
      } catch (err) {
        // Fallback
      }
    }

    return memorySongs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.genre && s.genre.toLowerCase().includes(q)) ||
        (s.album && s.album.toLowerCase().includes(q))
    );
  },

  // Users
  async findUserByEmail(email) {
    if (getStatus()) {
      try {
        return await User.findOne({ email: email.toLowerCase() });
      } catch (err) {
        // Fallback
      }
    }
    return memoryUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id) {
    if (getStatus()) {
      try {
        return await User.findById(id);
      } catch (err) {
        // Fallback
      }
    }
    return memoryUsers.find((u) => u._id.toString() === id.toString()) || null;
  },

  async createUser(userData) {
    if (getStatus()) {
      try {
        return await User.create(userData);
      } catch (err) {
        // Fallback
      }
    }
    const newUser = {
      _id: '66c300000000000000' + Math.floor(100000 + Math.random() * 900000),
      starsToday: 0,
      totalStars: 0,
      currentStreak: 1,
      totalFocusMinutes: 0,
      badges: [],
      favorites: [],
      recentlyPlayed: [],
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
      ...userData,
    };
    memoryUsers.push(newUser);
    return newUser;
  },

  // Recently Played History
  async recordSongPlayed(userId, songData) {
    const item = {
      songId: songData._id || songData.id || '66a100000000000000000001',
      title: songData.title || 'Focus Beat',
      artist: songData.artist || 'VibeFlow',
      coverUrl: songData.coverUrl || 'assets/images/study_mix.jpg',
      audioUrl: songData.audioUrl || '',
      duration: songData.duration || 180,
      genre: songData.genre || 'Study',
      playedAt: new Date(),
    };

    if (getStatus()) {
      try {
        const user = await User.findById(userId);
        if (user) {
          if (!user.recentlyPlayed) user.recentlyPlayed = [];
          // Filter out existing duplicate of same song to push to top
          user.recentlyPlayed = user.recentlyPlayed.filter(
            (p) => p.title !== item.title
          );
          user.recentlyPlayed.unshift(item);
          if (user.recentlyPlayed.length > 30) user.recentlyPlayed.pop();
          await user.save();
          return user.recentlyPlayed;
        }
      } catch (err) {
        console.error('Mongo error in recordSongPlayed:', err.message);
      }
    }

    let user = memoryUsers.find((u) => u._id.toString() === userId.toString()) || memoryUsers[0];
    if (user) {
      if (!user.recentlyPlayed) user.recentlyPlayed = [];
      user.recentlyPlayed = user.recentlyPlayed.filter((p) => p.title !== item.title);
      user.recentlyPlayed.unshift(item);
      if (user.recentlyPlayed.length > 30) user.recentlyPlayed.pop();
      return user.recentlyPlayed;
    }
    return [item];
  },

  async getRecentlyPlayed(userId) {
    let user = await this.findUserById(userId);
    if (!user && memoryUsers.length > 0) user = memoryUsers[0];
    return (user && user.recentlyPlayed) || [];
  },

  // Favorite Songs (Liked Songs)
  async toggleFavoriteSong(userId, song) {
    if (!song) return { isFavorited: false, favoriteSongs: [] };

    const songItem = {
      songId: song._id || song.songId || ('66a1' + Math.random().toString(16).slice(2, 22)),
      title: song.title,
      artist: song.artist,
      album: song.album || 'VibeFlow Collection',
      coverUrl: song.coverUrl || 'assets/images/study_mix.jpg',
      audioUrl: song.audioUrl,
      duration: song.duration || 180,
      genre: song.genre || 'Music',
      addedAt: new Date(),
    };

    if (getStatus()) {
      try {
        const user = await User.findById(userId);
        if (user) {
          if (!user.favoriteSongs) user.favoriteSongs = [];

          const existingIndex = user.favoriteSongs.findIndex(
            (f) =>
              (f.songId && songItem.songId && f.songId.toString() === songItem.songId.toString()) ||
              f.title === songItem.title
          );

          let isFavorited = false;
          if (existingIndex > -1) {
            user.favoriteSongs.splice(existingIndex, 1);
            isFavorited = false;
          } else {
            user.favoriteSongs.unshift(songItem);
            isFavorited = true;
          }

          await user.save();
          return { isFavorited, favoriteSongs: user.favoriteSongs };
        }
      } catch (err) {
        console.error('Mongo error in toggleFavoriteSong:', err.message);
      }
    }

    let user = memoryUsers.find((u) => u._id.toString() === userId.toString()) || memoryUsers[0];
    if (user) {
      if (!user.favoriteSongs) user.favoriteSongs = [];
      const existingIndex = user.favoriteSongs.findIndex(
        (f) =>
          (f.songId && songItem.songId && f.songId.toString() === songItem.songId.toString()) ||
          f.title === songItem.title
      );

      let isFavorited = false;
      if (existingIndex > -1) {
        user.favoriteSongs.splice(existingIndex, 1);
        isFavorited = false;
      } else {
        user.favoriteSongs.unshift(songItem);
        isFavorited = true;
      }
      return { isFavorited, favoriteSongs: user.favoriteSongs };
    }

    return { isFavorited: true, favoriteSongs: [songItem] };
  },

  async getFavoriteSongs(userId) {
    if (getStatus()) {
      try {
        const user = await User.findById(userId).lean();
        if (user) return user.favoriteSongs || [];
      } catch (err) {
        console.error('Mongo error in getFavoriteSongs:', err.message);
      }
    }
    let user = memoryUsers.find((u) => u._id.toString() === userId.toString()) || memoryUsers[0];
    return (user && user.favoriteSongs) || [];
  },

  // User Spotify-Style Settings
  async getUserSettings(userId) {
    let user = await this.findUserById(userId);
    if (!user && memoryUsers.length > 0) user = memoryUsers[0];
    return (
      (user && user.settings) || {
        audioQuality: 'Very High (320kbps)',
        equalizer: 'Lo-Fi Chill',
        crossfadeSeconds: 4,
        gaplessPlayback: true,
        autoPauseOnTimer: true,
        soundChimeEnabled: true,
        dailyStarGoal: 5,
        privateSession: false,
      }
    );
  },

  async updateUserSettings(userId, newSettings) {
    if (getStatus()) {
      try {
        const user = await User.findById(userId);
        if (user) {
          user.settings = { ...user.settings, ...newSettings };
          await user.save();
          return user.settings;
        }
      } catch (err) {
        console.error('Mongo error in updateUserSettings:', err.message);
      }
    }

    let user = memoryUsers.find((u) => u._id.toString() === userId.toString()) || memoryUsers[0];
    if (user) {
      user.settings = { ...(user.settings || {}), ...newSettings };
      return user.settings;
    }
    return newSettings;
  },

  async updateUserProfile(userId, { username, email, newPassword, avatar }) {
    let hashedPassword = null;
    if (newPassword && newPassword.trim().length >= 6) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(newPassword, salt);
    }

    if (getStatus()) {
      try {
        const user = await User.findById(userId);
        if (user) {
          if (username) user.username = username.trim();
          if (email) user.email = email.trim().toLowerCase();
          if (avatar) user.avatar = avatar;
          if (hashedPassword) user.password = hashedPassword;
          await user.save();
          return user;
        }
      } catch (err) {
        console.error('Mongo error in updateUserProfile:', err.message);
      }
    }

    let user = memoryUsers.find((u) => u._id.toString() === userId.toString()) || memoryUsers[0];
    if (user) {
      if (username) user.username = username.trim();
      if (email) user.email = email.trim().toLowerCase();
      if (avatar) user.avatar = avatar;
      if (hashedPassword) user.password = hashedPassword;
      return user;
    }
    return null;
  },

  async resetUserStars(userId) {
    if (getStatus()) {
      try {
        const user = await User.findById(userId);
        if (user) {
          user.starsToday = 0;
          user.totalStars = 0;
          user.currentStreak = 0;
          user.totalFocusMinutes = 0;
          await user.save();
          return user;
        }
      } catch (err) {
        console.error('Mongo error in resetUserStars:', err.message);
      }
    }

    let user = memoryUsers.find((u) => u._id.toString() === userId.toString()) || memoryUsers[0];
    if (user) {
      user.starsToday = 0;
      user.totalStars = 0;
      user.currentStreak = 0;
      user.totalFocusMinutes = 0;
      return user;
    }
    return null;
  },

  // Focus Sessions & Gamification
  async recordFocusSession(userId, durationMinutes = 30, playlistId = null) {
    const starsEarned = Math.max(1, Math.floor(durationMinutes / 30));

    let updatedUser = null;
    let newSession = null;

    if (getStatus()) {
      try {
        const user = await User.findById(userId);
        if (user) {
          user.recordFocusSession(durationMinutes, starsEarned);
          await user.save();
          updatedUser = user;

          newSession = await FocusSession.create({
            userId: user._id,
            playlistId: playlistId || null,
            durationMinutes,
            starsEarned,
            completedSuccessfully: true,
            notes: `Completed ${durationMinutes}-minute focus session!`,
          });
        }
      } catch (err) {
        console.error('Mongo error in recordFocusSession:', err.message);
      }
    }

    if (!updatedUser) {
      let user = memoryUsers.find((u) => u._id.toString() === userId.toString()) || memoryUsers[0];
      if (user) {
        user.starsToday = (user.starsToday || 0) + starsEarned;
        user.totalStars = (user.totalStars || 0) + starsEarned;
        user.totalFocusMinutes = (user.totalFocusMinutes || 0) + durationMinutes;
        user.currentStreak = (user.currentStreak || 1) + 1;
        user.lastActiveDate = new Date();

        if (!user.badges) user.badges = [];
        const badgeNames = user.badges.map((b) => b.name);
        if (!badgeNames.includes('First Star')) {
          user.badges.push({
            name: 'First Star',
            icon: '⭐',
            description: 'Completed your first 30-minute focus session!',
            unlockedAt: new Date(),
          });
        }

        updatedUser = user;
        newSession = {
          _id: '66d400000000000000' + Math.floor(100000 + Math.random() * 900000),
          userId: user._id,
          playlistId,
          durationMinutes,
          starsEarned,
          completedSuccessfully: true,
          sessionDate: new Date(),
          notes: `Completed ${durationMinutes}-minute focus session!`,
        };
        memorySessions.push(newSession);
      }
    }

    return { user: updatedUser, session: newSession, starsEarned };
  },

  async getUserFocusStats(userId) {
    let user = await this.findUserById(userId);
    if (!user && memoryUsers.length > 0) user = memoryUsers[0];

    let sessions = [];
    if (getStatus()) {
      try {
        sessions = await FocusSession.find({ userId: user ? user._id : userId })
          .sort({ sessionDate: -1 })
          .limit(20)
          .lean();
      } catch (err) {
        // Fallback
      }
    }

    if (!sessions || sessions.length === 0) {
      sessions = memorySessions.filter(
        (s) => s.userId.toString() === (user ? user._id.toString() : userId.toString())
      );
    }

    const currentStars = user ? (user.starsToday || 0) : 0;
    const currentTotalStars = user ? (user.totalStars || 0) : 0;
    const currentStreak = user ? (user.currentStreak || 0) : 0;
    const currentMinutes = user ? (user.totalFocusMinutes || 0) : 0;

    // Build real 7-day weekly stats
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentDayIdx = (new Date().getDay() + 6) % 7; // 0=Mon, 6=Sun
    const weeklySummary = days.map((day, idx) => {
      if (idx === currentDayIdx) {
        return { day, minutes: currentMinutes, stars: currentStars };
      }
      return { day, minutes: 0, stars: 0 };
    });

    return {
      starsToday: currentStars,
      totalStars: currentTotalStars,
      currentStreak: currentStreak,
      totalFocusMinutes: currentMinutes,
      badges: user ? (user.badges || []) : [],
      settings: user ? (user.settings || {}) : {},
      recentSessions: sessions || [],
      weeklySummary,
    };
  },
};

module.exports = dataStore;
