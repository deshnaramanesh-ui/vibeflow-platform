require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const Song = require('../models/Song');
const FocusSession = require('../models/FocusSession');
const { defaultSongs, defaultPlaylists, defaultUser } = require('./defaultData');

const seedDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vibeflow_db';
  console.log(`Connecting to MongoDB at: ${uri}...`);

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB!');

    // Clear existing data
    console.log('Clearing old collections...');
    await Promise.all([
      User.deleteMany({}),
      Playlist.deleteMany({}),
      Song.deleteMany({}),
      FocusSession.deleteMany({}),
    ]);

    // Insert songs
    console.log(`Seeding ${defaultSongs.length} songs across 5 mood categories...`);
    const createdSongs = await Song.insertMany(defaultSongs);

    // Insert playlists
    console.log(`Seeding ${defaultPlaylists.length} playlists...`);
    const createdPlaylists = await Playlist.insertMany(defaultPlaylists);

    // Insert demo user with settings and clean 0 stats
    console.log('Seeding demo student user (starting with 0 stars & 0 focus minutes)...');
    const createdUser = await User.create(defaultUser);

    console.log('🎉 Database Seeding Completed Successfully!');
    console.log(`- Total Songs: ${createdSongs.length}`);
    console.log(`- Total Playlists: ${createdPlaylists.length}`);
    console.log(`- Demo User: ${createdUser.username} (${createdUser.email})`);
    console.log(`- Starting Stars: 0 | Starting Focus Time: 0m`);

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  }
};

seedDB();
