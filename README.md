# 🎵 VibeFlow - Music Streaming Platform for Students

> **Full-Stack NoSQL MongoDB Application with Study Mix Focus Mode, 30-Minute Star Rewards & Streak Dashboard**

---

## 🌟 Features Overview

1. **Exact Visual Match to Design**:
   - Neon purple/magenta theme (`#0b0713`, `#ff007f`, `#e91e63`)
   - Left Navigation Sidebar with quick links & daily streak widget
   - Gradient Hero Banner with smooth typography
   - 5 Featured Playlists: **Study Mix**, **Relax Beat**, **Energy Boost**, **Sleep Sounds**, and **Travel Tunes**
   - Full Web Audio Player with scrubbable progress bar, volume slider, and track metadata

2. **Student Study Mix & 30-Minute Star Reward System (Special Enhancement)**:
   - **Integrated Pomodoro Study Timer**: Built-in 30-minute countdown synchronized with Study Mix soft lo-fi beats.
   - **Star Gamification (⭐)**: Earn +1 Star for every 30 minutes of study.
   - **Fast Demo Mode (⚡ 5s)**: Built-in 5-second mode for live presentations and instant grading demonstration.
   - **Student Dashboard**: Live daily stars tracker, active streak count (🔥), weekly study time bar chart, and milestone badges.

3. **Backend RESTful API & MongoDB Integration**:
   - **Node.js & Express API** with CORS, JWT authentication, and bcrypt password security.
   - **Mongoose Models**: `User`, `Playlist`, `Song`, and `FocusSession`.
   - Built-in database seeder script (`npm run seed`).

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed the MongoDB Database
Ensure MongoDB is running locally or configured in `.env`, then run:
```bash
npm run seed
```

### 3. Start the VibeFlow Application
```bash
npm start
```
Open your browser and navigate to:
```
http://localhost:5000
```

### 4. Run Automated API Tests
```bash
node test_api.js
```

---

## 🔑 Demo Login Credentials
- **Student Email**: `alex@student.edu`
- **Password**: `password123`
- *(Or click the "⚡ Quick 1-Click Demo Login" button in the login modal)*

---

## 📁 Project Directory Structure
```
NOSQL FINAL/
├── package.json                          # Dependencies & scripts
├── server.js                              # Express server & API endpoints
├── test_api.js                            # Automated test runner for REST APIs
├── presentation_and_screenshots_guide.md  # Step-by-step screenshot & presentation guide
├── config/
│   └── db.js                              # Mongoose connection logic
├── models/
│   ├── User.js                            # User schema (streaks, stars, badges)
│   ├── Playlist.js                        # Playlist schema
│   ├── Song.js                            # Song metadata schema
│   └── FocusSession.js                    # Study session log schema
├── routes/
│   ├── authRoutes.js                      # Login, register, profile
│   ├── playlistRoutes.js                  # Playlists & search
│   ├── focusRoutes.js                     # 30-min session completion & star rewards
│   └── userRoutes.js                      # Favorites & history
├── services/
│   └── dataStore.js                       # Universal data provider with fallback
├── seed/
│   ├── defaultData.js                     # Default playlists, songs, and student profile
│   └── seedData.js                        # Database population script
└── public/                                # Frontend single-page application
    ├── index.html                         # Main webpage matching design screenshot
    ├── css/
    │   ├── style.css                      # Neon dark UI styling
    │   └── dashboard.css                  # Focus timer & star dashboard styling
    ├── js/
    │   ├── api.js                         # REST API fetch client
    │   ├── player.js                      # Music audio player & lo-fi synth
    │   ├── timer.js                       # 30-min Pomodoro timer & star claim logic
    │   ├── dashboard.js                   # Student streak & weekly charts
    │   └── app.js                         # Main application controller
    └── assets/
        └── images/                        # Generated aesthetic playlist covers
```
