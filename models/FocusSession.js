const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    playlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Playlist',
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 30,
    },
    starsEarned: {
      type: Number,
      default: 1, // 1 star per 30 minutes
    },
    completedSuccessfully: {
      type: Boolean,
      default: true,
    },
    sessionDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: 'Completed 30-min Study Mix Focus Session',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FocusSession', focusSessionSchema);
