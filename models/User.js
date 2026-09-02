const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    // Student Gamification & Focus Metrics
    starsToday: {
      type: Number,
      default: 0,
    },
    totalStars: {
      type: Number,
      default: 0,
    },
    currentStreak: {
      type: Number,
      default: 1, // days
    },
    totalFocusMinutes: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
      default: Date.now,
    },
    badges: [
      {
        name: String,
        icon: String,
        description: String,
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
    settings: {
      audioQuality: { type: String, default: 'Very High (320kbps)' },
      equalizer: { type: String, default: 'Lo-Fi Chill' },
      crossfadeSeconds: { type: Number, default: 4 },
      gaplessPlayback: { type: Boolean, default: true },
      autoPauseOnTimer: { type: Boolean, default: true },
      soundChimeEnabled: { type: Boolean, default: true },
      dailyStarGoal: { type: Number, default: 5 },
      privateSession: { type: Boolean, default: false },
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist',
      },
    ],
    favoriteSongs: [
      {
        songId: { type: mongoose.Schema.Types.Mixed },
        title: String,
        artist: String,
        album: String,
        coverUrl: String,
        audioUrl: String,
        duration: Number,
        genre: String,
        addedAt: { type: Date, default: Date.now },
      },
    ],
    recentlyPlayed: [
      {
        songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
        title: String,
        artist: String,
        coverUrl: String,
        audioUrl: String,
        duration: Number,
        genre: String,
        playedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Method to check and update daily streak
userSchema.methods.recordFocusSession = function (minutes, stars) {
  const now = new Date();
  const lastActive = this.lastActiveDate ? new Date(this.lastActiveDate) : null;
  
  const isSameDay =
    lastActive &&
    now.getFullYear() === lastActive.getFullYear() &&
    now.getMonth() === lastActive.getMonth() &&
    now.getDate() === lastActive.getDate();

  const isYesterday =
    lastActive &&
    now.getTime() - lastActive.getTime() < 48 * 60 * 60 * 1000 &&
    now.getDate() !== lastActive.getDate();

  if (isSameDay) {
    this.starsToday += stars;
  } else {
    // New day, reset stars today
    this.starsToday = stars;
    if (isYesterday) {
      this.currentStreak += 1;
    } else {
      this.currentStreak = 1;
    }
  }

  this.totalStars += stars;
  this.totalFocusMinutes += minutes;
  this.lastActiveDate = now;

  // Award milestone badges
  const badgeNames = this.badges.map((b) => b.name);
  if (this.totalStars >= 1 && !badgeNames.includes('First Star')) {
    this.badges.push({
      name: 'First Star',
      icon: '⭐',
      description: 'Completed your first 30-minute focus session!',
    });
  }
  if (this.currentStreak >= 3 && !badgeNames.includes('Streak Master')) {
    this.badges.push({
      name: 'Streak Master',
      icon: '🔥',
      description: 'Maintained a 3-day study streak!',
    });
  }
  if (this.totalFocusMinutes >= 120 && !badgeNames.includes('Lo-Fi Scholar')) {
    this.badges.push({
      name: 'Lo-Fi Scholar',
      icon: '🎓',
      description: 'Completed 2 hours of deep work with Study Mix!',
    });
  }
};

module.exports = mongoose.model('User', userSchema);
