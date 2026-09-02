const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['Study', 'Relax', 'Energy', 'Sleep', 'Travel', 'Custom'],
      default: 'Study',
    },
    coverImage: {
      type: String,
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: true,
    },
    isFocusMode: {
      type: Boolean,
      default: false, // true for Study Mix
    },
    timerDurationMinutes: {
      type: Number,
      default: 30, // 30 minutes for Study Mix
    },
    colorGradient: {
      type: String,
      default: 'linear-gradient(135deg, #a81c7d 0%, #7b1fa2 50%, #4a148c 100%)',
    },
    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Song',
      },
    ],
    creator: {
      type: String,
      default: 'VibeFlow Curators',
    },
    likesCount: {
      type: Number,
      default: 120,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Playlist', playlistSchema);
