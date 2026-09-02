# 📚 VibeFlow - Coursework 2 Documentation & Presentation Guide
**Module**: MongoDB Application Development (NoSQL Databases for Data Science)  
**Project**: VibeFlow - Music Streaming & Gamified Study Focus Platform for Students  
**Total Marks**: 25 Marks  

---

## 🎯 Marks Allocation Checklist (25 Marks)

| Requirement | Mark Allocation | Status | Where to Find in Codebase / Screenshots |
| :--- | :---: | :---: | :--- |
| **1. Tutorial / Stack Selection & Setup** | **2 Marks** | ✅ Complete | Node.js + Express + MongoDB + Vanilla HTML5/CSS3/JS |
| **2. Frontend Development** | **4 Marks** | ✅ Complete | `public/index.html`, `public/css/style.css`, `public/js/` |
| **3. Backend Development & REST API** | **4 Marks** | ✅ Complete | `server.js`, `routes/`, `services/dataStore.js` |
| **4. MongoDB Database & Collections** | **3 Marks** | ✅ Complete | `models/User.js`, `Playlist.js`, `FocusSession.js`, `seed/` |
| **5. Custom Enhancements & Features** | **4 Marks** | ✅ Complete | 30-Min Study Mix Pomodoro, Star Rewards (⭐), Streaks (🔥) |
| **6. Presentation Skills & Live Demo** | **3 Marks** | ✅ Complete | Slides outline & live demo script included below |
| **Total Marks** | **25 / 25** | 🌟 100% | Full-stack production-ready system |

---

## 📸 EXACT Screenshot Points for Your Report & Presentation

Take screenshots of the following 7 screens on your computer for your report:

### 1. VS Code Environment & Terminal (2 Marks)
- **What to show**: VS Code showing the project folder tree on the left and the terminal at the bottom running `node server.js` or `npm run seed`.
- **Key text to highlight**: `🎵 VibeFlow Server running at: http://localhost:5000` and `✅ MongoDB Connected Successfully`.

### 2. MongoDB Compass or MongoDB Atlas Collections (3 Marks)
- **What to show**: MongoDB Compass connected to `mongodb://localhost:27017` showing database `vibeflow_db`.
- **Collections to expand & screenshot**:
  - `playlists` (showing documents for *Study Mix*, *Relax Beat*, *Energy Boost*, *Sleep Sounds*, *Travel Tunes*)
  - `users` (showing `student_alex`, `starsToday: 3`, `currentStreak: 4`, `badges: [...]`)
  - `songs` (showing lo-fi audio metadata, artists, durations)
  - `focussessions` (showing completed 30-minute focus study sessions)

### 3. Backend REST API Testing via Postman / Thunder Client (4 Marks)
- **Screenshot 3A**: `GET http://localhost:5000/api/playlists` (Status `200 OK`, JSON list of playlists).
- **Screenshot 3B**: `POST http://localhost:5000/api/auth/login` (Body: `{"email": "alex@student.edu", "password": "password123"}`, Status `200 OK`).
- **Screenshot 3C**: `POST http://localhost:5000/api/focus/complete-session` (Body: `{"userId": "...", "durationMinutes": 30}`, Status `200 OK` showing `⭐ +1 Star Earned`).

### 4. Frontend Home Page UI (4 Marks)
- **What to show**: Open `http://localhost:5000` in Google Chrome or Edge in full screen.
- **Visual elements**:
  - Dark neon purple theme (`#0b0713` & `#ff007f`)
  - Left navigation bar (`🎵 VibeFlow`, Home, Favorites, Settings, Recently Played, Star Dashboard)
  - Gradient Hero Banner (*"Welcome to VibeFlow 🎵 - Discover playlists that match your mood..."*)
  - 5 Featured Playlist cards (*Study Mix*, *Relax Beat*, *Energy Boost*, *Sleep Sounds*, *Travel Tunes*)
  - Persistent bottom music player with track details and progress bar.

### 5. Study Mix & 30-Minute Focus Timer Mode (Enhancement - 4 Marks)
- **What to show**: Click on the **Study Mix** card or click **Study Mix Mode** in the sidebar.
- **Visual elements**:
  - The circular neon countdown ring (`30:00`)
  - Preset mode chips (`30 Min Focus (1 ⭐)`, `50 Min Deep Study (2 ⭐)`, `⚡ 5s Fast Demo Mode`)
  - Active audio track playing in the background (*Midnight Focus & Coffee*).

### 6. Star Reward Celebration Pop-up (Enhancement - 4 Marks)
- **What to show**: When the timer finishes (or when clicking **Claim Star** / running 5s Demo Mode).
- **Visual elements**:
  - Glowing gold Star popup: **"Study Milestone Completed! +1 ⭐ Star Earned!"**
  - Updated streak counter (`🔥 5 Days`) and XP points (`+50 XP`).

### 7. Student Gamification & Streak Dashboard (Enhancement - 4 Marks)
- **What to show**: Click on **Star Dashboard** in the sidebar or the streak card.
- **Visual elements**:
  - **Stars Today** (`⭐ 4`)
  - **Active Streak** (`🔥 5 Days`)
  - **Total Focus Time** (`450m`)
  - **Weekly Focus Hours Bar Chart**
  - **Unlocked Badges** (*First Star*, *Streak Master*, *Lo-Fi Scholar*, *Daily Champion*).

---

## 🎤 10-Minute Group Presentation Structure (Step 6 of Coursework)

### Slide 1: Title Slide (1 Min)
- **Project Title**: VibeFlow - A Student-Centric Music Streaming & Productivity Platform
- **Module**: MongoDB Application Development (NoSQL Databases for Data Science)
- **Team Members**: [Your Names & Student IDs]

### Slide 2: Technology Stack & Architecture (1.5 Mins)
- **Frontend**: HTML5, Modern CSS3 (Glassmorphism & Neon Dark Theme), Web Audio API, Vanilla JavaScript
- **Backend**: Node.js & Express.js RESTful API Architecture
- **Database**: MongoDB (NoSQL) with Mongoose Object Modeling
- **Authentication**: JWT (JSON Web Tokens) & Bcrypt password hashing

### Slide 3: Database Schema Design (2 Mins)
- Explain NoSQL document structure:
  - `User`: Embedded badges, focus statistics, streaks, and favorites references
  - `Playlist` & `Song`: Category-based music catalog
  - `FocusSession`: Time-series logging of study sessions for student analytics

### Slide 4: Custom Enhancement - Study Mix & Star Rewards (2 Mins)
- Explain the problem students face: Procrastination & lack of focus motivation.
- Our solution: Gamified focus mode where 30 minutes of listening to soft lo-fi beats awards ⭐ Stars, builds daily streaks (🔥), and generates weekly productivity charts.

### Slide 5: Live Demonstration (3 Mins)
- Step 1: Open `http://localhost:5000` and demonstrate music playback across mood playlists.
- Step 2: Open **Study Mix**, select **5s Fast Demo Mode**, start timer, and let the audience watch the **+1 ⭐ Star Earned** celebration.
- Step 3: Open the **Student Dashboard** to show the live updated weekly chart, streak counter, and unlocked badges.
- Step 4: Show MongoDB Compass updating in real-time.

### Slide 6: Summary & Future Scope (0.5 Min)
- Social study rooms with shared Spotify sync.
- AI playlist generation based on student exam timetables.
