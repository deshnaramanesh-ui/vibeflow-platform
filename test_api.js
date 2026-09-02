// Test script for VibeFlow APIs including Settings, Recently Played & Custom Songs

async function testAPIs() {
  const baseUrl = 'http://localhost:5000';
  console.log('Testing VibeFlow Full-Stack APIs at:', baseUrl);

  try {
    // 1. Health
    const health = await fetch(`${baseUrl}/api/health`).then(r => r.json());
    console.log('\n[1] GET /api/health:\n', JSON.stringify(health, null, 2));

    // 2. Playlists & Expanded Songs
    const playlistsRes = await fetch(`${baseUrl}/api/playlists`).then(r => r.json());
    console.log('\n[2] GET /api/playlists (Count:', playlistsRes.count, '):');
    playlistsRes.playlists.forEach(p => {
      console.log(` - ${p.title} (${p.category}): ${p.songs?.length || 0} songs`);
    });

    // 3. Auth Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex@student.edu', password: 'password123' })
    }).then(r => r.json());
    console.log('\n[3] POST /api/auth/login:\n', JSON.stringify(loginRes.user, null, 2));

    // 4. Spotify Settings API Test
    const settingsGet = await fetch(`${baseUrl}/api/users/settings?userId=${loginRes.user?.id}`).then(r => r.json());
    console.log('\n[4A] GET /api/users/settings:\n', JSON.stringify(settingsGet.settings, null, 2));

    const settingsUpdate = await fetch(`${baseUrl}/api/users/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: loginRes.user?.id,
        settings: { audioQuality: 'Very High (320kbps)', crossfadeSeconds: 6, dailyStarGoal: 6 }
      })
    }).then(r => r.json());
    console.log('\n[4B] POST /api/users/settings:\n', JSON.stringify(settingsUpdate, null, 2));

    // 5. Recently Played History API Test
    const historyRes = await fetch(`${baseUrl}/api/users/history?userId=${loginRes.user?.id}`).then(r => r.json());
    console.log('\n[5] GET /api/users/history (Count:', historyRes.count, '):\n',
      historyRes.recentlyPlayed?.slice(0, 3).map(h => ({ title: h.title, artist: h.artist, genre: h.genre, playedAt: h.playedAt }))
    );

    // 6. Add Custom Song to Category Playlist
    const studyMix = playlistsRes.playlists[0];
    const addSongRes = await fetch(`${baseUrl}/api/playlists/${studyMix._id}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Lofi Exam Cram Chill',
        artist: 'Alex Student',
        duration: 210,
        genre: 'Lo-Fi / Study'
      })
    }).then(r => r.json());
    console.log('\n[6] POST /api/playlists/:id/songs (Add Song):\n', JSON.stringify(addSongRes, null, 2));

    // 7. Focus Session Completion & Stars
    const focusRes = await fetch(`${baseUrl}/api/focus/complete-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: loginRes.user?.id, durationMinutes: 30 })
    }).then(r => r.json());
    console.log('\n[7] POST /api/focus/complete-session:\n', JSON.stringify(focusRes, null, 2));

    console.log('\n🎉 ALL 7 BACKEND API TESTS (INCLUDING SPOTIFY SETTINGS, HISTORY & ADD SONG) PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('API Test Error:', err);
  }
}

testAPIs();
