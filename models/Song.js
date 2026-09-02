const mongoose = require('mongoose');

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    artist: {
      type: String,
      required: true,
      trim: true,
    },
    album: {
      type: String,
      default: 'VibeFlow Originals',
    },
    duration: {
      type: Number, // in seconds
      required: true,
      default: 180,
    },
    audioUrl: {
      type: String,
      required: true,
    },
    coverUrl: {
      type: String,
      required: true,
    },
    genre: {
      type: String,
      default: 'Lo-Fi / Study',
    },
    tempoBpm: {
      type: Number,
      default: 80,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Song', songSchema);
