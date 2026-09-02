require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, getStatus } = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const focusRoutes = require('./routes/focusRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Connect to Database
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/users', userRoutes);

// Health & System Info endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'VibeFlow Music & Focus Platform',
    version: '1.0.0',
    database: getStatus() ? 'MongoDB Connected' : 'Memory Store Active (MongoDB Standby)',
    timestamp: new Date().toISOString(),
  });
});

// Single Page Application route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🎵 VibeFlow Server running at: http://localhost:${PORT}`);
  console.log(`⭐ Study Mix Focus Mode Active on Port: ${PORT}`);
  console.log(`📊 Database Status: ${getStatus() ? 'MongoDB Connected' : 'Ready'}`);
  console.log(`======================================================\n`);
});
