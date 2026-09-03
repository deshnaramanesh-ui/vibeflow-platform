// VibeFlow Main Application Controller (with Spotify Settings & Recently Played & Custom Songs)

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Global Instances
  window.player = new MusicPlayer();
  window.timer = new FocusTimer();
  window.dashboard = new StudentDashboard();
  window.allPlaylists = [];
  window.currentUser = null;
  window.currentViewingPlaylist = null;

  // Toast Helper
  window.showToast = function (message) {
    const toast = document.getElementById('toast-notification');
    const toastMsg = document.getElementById('toast-message');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  };

  window.openFocusModal = function () {
    const modal = document.getElementById('focus-timer-modal');
    if (modal) {
      modal.classList.add('active');
      if (window.timer) {
        window.timer.updateDisplay();
        const startBtn = document.getElementById('btn-timer-toggle');
        if (startBtn) {
          if (window.timer.isRunning) {
            startBtn.innerHTML = '<i class="fas fa-pause"></i> Pause Study Session';
            startBtn.style.backgroundColor = '#d81b60';
          } else if (window.timer.remainingSeconds < window.timer.totalDuration) {
            startBtn.innerHTML = '<i class="fas fa-play"></i> Resume Focus';
            startBtn.style.backgroundColor = 'var(--primary-magenta)';
          } else {
            startBtn.innerHTML = '<i class="fas fa-play"></i> Start 30-Min Focus';
            startBtn.style.backgroundColor = 'var(--primary-magenta)';
          }
        }
      }
    }
  };

  window.closeFocusModal = function () {
    const modal = document.getElementById('focus-timer-modal');
    if (modal) modal.classList.remove('active');
  };

  window.openAuthModal = function (isRegister = false) {
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('auth-modal-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const usernameGroup = document.getElementById('auth-username-group');

    if (isRegister) {
      title.textContent = 'Join VibeFlow for Students';
      submitBtn.textContent = 'Create Free Account';
      usernameGroup.style.display = 'block';
    } else {
      title.textContent = 'Student Login';
      submitBtn.textContent = 'Log In';
      usernameGroup.style.display = 'none';
    }

    if (modal) modal.classList.add('active');
  };

  window.closeModals = function () {
    document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.remove('active'));
  };

  // ==========================================
  // Spotify-Style Settings Modal Logic
  // ==========================================
  window.openSettingsModal = async function () {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    // Populate user profile/account fields
    if (window.currentUser) {
      if (document.getElementById('set-account-username')) document.getElementById('set-account-username').value = window.currentUser.username || 'student_alex';
      if (document.getElementById('set-account-email')) document.getElementById('set-account-email').value = window.currentUser.email || 'alex@student.edu';
      if (document.getElementById('set-account-password')) document.getElementById('set-account-password').value = '';
    }

    const res = await window.API.getUserSettings();
    if (res.success && res.settings) {
      const s = res.settings;
      if (document.getElementById('set-audio-quality')) document.getElementById('set-audio-quality').value = s.audioQuality || 'Very High (320kbps)';
      if (document.getElementById('set-equalizer')) document.getElementById('set-equalizer').value = s.equalizer || 'Lo-Fi Chill';
      if (document.getElementById('set-crossfade')) {
        document.getElementById('set-crossfade').value = s.crossfadeSeconds || 4;
        document.getElementById('crossfade-val-lbl').textContent = `${s.crossfadeSeconds || 4}s`;
      }
      if (document.getElementById('set-gapless')) document.getElementById('set-gapless').checked = s.gaplessPlayback !== false;
      if (document.getElementById('set-autopause')) document.getElementById('set-autopause').checked = s.autoPauseOnTimer !== false;
      if (document.getElementById('set-chime')) document.getElementById('set-chime').checked = s.soundChimeEnabled !== false;
      if (document.getElementById('set-star-goal')) {
        document.getElementById('set-star-goal').value = s.dailyStarGoal || 5;
        document.getElementById('star-goal-val-lbl').textContent = `${s.dailyStarGoal || 5} ⭐`;
      }
      if (document.getElementById('set-private')) document.getElementById('set-private').checked = !!s.privateSession;
    }

    modal.classList.add('active');
  };

  // Crossfade & Star Goal Sliders Live Label
  document.getElementById('set-crossfade')?.addEventListener('input', (e) => {
    document.getElementById('crossfade-val-lbl').textContent = `${e.target.value}s`;
  });
  document.getElementById('set-star-goal')?.addEventListener('input', (e) => {
    document.getElementById('star-goal-val-lbl').textContent = `${e.target.value} ⭐`;
  });

  // Toggle Password Visibility in Settings
  document.getElementById('btn-toggle-set-pwd')?.addEventListener('click', () => {
    const pwdInput = document.getElementById('set-account-password');
    const icon = document.querySelector('#btn-toggle-set-pwd i');
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
      icon.className = 'fa-solid fa-eye-slash';
    } else {
      pwdInput.type = 'password';
      icon.className = 'fa-solid fa-eye';
    }
  });

  // Toggle Password Visibility in Auth Modal
  document.getElementById('btn-toggle-auth-pwd')?.addEventListener('click', () => {
    const pwdInput = document.getElementById('auth-password');
    const icon = document.querySelector('#btn-toggle-auth-pwd i');
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
      icon.className = 'fa-solid fa-eye-slash';
    } else {
      pwdInput.type = 'password';
      icon.className = 'fa-solid fa-eye';
    }
  });

  // Auth Tab Switchers
  document.getElementById('auth-tab-login')?.addEventListener('click', () => window.openAuthModal(false));
  document.getElementById('auth-tab-register')?.addEventListener('click', () => window.openAuthModal(true));

  // Settings Logout Button
  document.getElementById('btn-settings-logout')?.addEventListener('click', () => {
    window.API.clearToken();
    window.currentUser = null;
    document.getElementById('auth-actions').innerHTML = `
      <button class="btn btn-outline" id="btn-login">Login</button>
      <button class="btn btn-primary" id="btn-register">Register</button>
    `;
    document.getElementById('btn-login')?.addEventListener('click', () => window.openAuthModal(false));
    document.getElementById('btn-register')?.addEventListener('click', () => window.openAuthModal(true));
    window.closeModals();
    window.showToast('👋 You have been logged out.');
  });

  // Settings Switch Auth Button
  document.getElementById('btn-settings-switch-auth')?.addEventListener('click', () => {
    window.closeModals();
    window.openAuthModal(false);
  });

  // Save Settings & Account Credentials Form
  document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Update Spotify playback settings
    const newSettings = {
      audioQuality: document.getElementById('set-audio-quality')?.value,
      equalizer: document.getElementById('set-equalizer')?.value,
      crossfadeSeconds: Number(document.getElementById('set-crossfade')?.value || 4),
      gaplessPlayback: document.getElementById('set-gapless')?.checked,
      autoPauseOnTimer: document.getElementById('set-autopause')?.checked,
      soundChimeEnabled: document.getElementById('set-chime')?.checked,
      dailyStarGoal: Number(document.getElementById('set-star-goal')?.value || 5),
      privateSession: document.getElementById('set-private')?.checked,
    };

    // 2. Update Account Credentials (Email / Username / Password)
    const newUsername = document.getElementById('set-account-username')?.value;
    const newEmail = document.getElementById('set-account-email')?.value;
    const newPassword = document.getElementById('set-account-password')?.value;

    await window.API.updateUserSettings(newSettings);

    if (newEmail || newUsername || newPassword) {
      const accountRes = await window.API.updateAccount({
        username: newUsername,
        email: newEmail,
        newPassword: newPassword || undefined,
      });

      if (accountRes.success && accountRes.user) {
        window.updateUserUI(accountRes.user);
      }
    }

    window.showToast('✅ Account & Spotify settings saved successfully!');
    window.closeModals();
  });

  // ==========================================
  // Recently Played Modal Logic
  // ==========================================
  window.openRecentlyPlayedModal = async function () {
    const modal = document.getElementById('recently-played-modal');
    const container = document.getElementById('recently-played-list');
    if (!modal || !container) return;

    container.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted);">Loading recent tracks...</div>';
    modal.classList.add('active');

    const res = await window.API.getRecentlyPlayed();
    if (res.success && res.recentlyPlayed && res.recentlyPlayed.length > 0) {
      container.innerHTML = '';
      const table = document.createElement('table');
      table.className = 'track-table';
      table.innerHTML = `
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th>Title & Artist</th>
            <th>Genre</th>
            <th>Played</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody id="recently-played-tbody"></tbody>
      `;
      container.appendChild(table);
      const tbody = table.querySelector('#recently-played-tbody');

      res.recentlyPlayed.forEach((song, idx) => {
        const tr = document.createElement('tr');
        const timeAgo = getTimeAgo(new Date(song.playedAt));
        tr.innerHTML = `
          <td style="color: var(--text-dim);">${idx + 1}</td>
          <td>
            <div class="track-title-cell">
              <img src="${song.coverUrl || 'assets/images/study_mix.jpg'}" class="track-thumb" alt="art" />
              <div>
                <div style="font-weight: 700; color: #ffffff;">${song.title}</div>
                <div style="font-size: 12px; color: var(--text-muted);">${song.artist}</div>
              </div>
            </div>
          </td>
          <td><span class="badge-genre">${song.genre || 'Music'}</span></td>
          <td style="color: var(--text-dim); font-size: 13px;">${timeAgo}</td>
          <td style="text-align: right;">
            <button class="track-table-play-btn" title="Play Again">
              <i class="fas fa-play" style="margin-left: 2px;"></i>
            </button>
          </td>
        `;

        tr.querySelector('.track-table-play-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          window.player.loadTrack(song, true);
          window.showToast(`▶ Now playing: ${song.title}`);
          window.closeModals();
        });

        tr.addEventListener('click', () => {
          window.player.loadTrack(song, true);
          window.showToast(`▶ Now playing: ${song.title}`);
          window.closeModals();
        });

        tbody.appendChild(tr);
      });
    } else {
      container.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-muted);">No recently played tracks yet. Play any song from the featured playlists!</div>';
    }
  };

  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  // ==========================================
  // Liked / Favorite Songs Logic & Modal
  // ==========================================
  window.favoriteSongs = [];

  window.loadFavoriteSongs = async function () {
    const res = await window.API.getFavoriteSongs();
    if (res.success && res.favoriteSongs) {
      window.favoriteSongs = res.favoriteSongs;
      if (window.player && window.player.currentTrack) {
        window.player.updateHeartState(window.player.currentTrack);
      }
    }
  };

  window.isSongFavorited = function (song) {
    if (!song) return false;
    const songId = (song._id || song.songId || '').toString();
    return window.favoriteSongs.some((f) => {
      const fId = (f._id || f.songId || '').toString();
      return (songId && fId && songId === fId) || f.title.toLowerCase() === (song.title || '').toLowerCase();
    });
  };

  window.toggleSongFavorite = async function (song) {
    if (!song) return;
    const res = await window.API.toggleFavoriteSong(song);
    if (res.success) {
      window.favoriteSongs = res.favoriteSongs || [];
      
      // Update player heart icon
      if (window.player && window.player.currentTrack) {
        window.player.updateHeartState(window.player.currentTrack);
      }

      // Update any table heart buttons currently visible
      document.querySelectorAll('.btn-table-heart').forEach((btn) => {
        if (btn.dataset.title === song.title) {
          if (res.isFavorited) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
            btn.title = 'Remove from Liked Songs';
          } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
            btn.title = 'Add to Liked Songs';
          }
        }
      });

      // If favorites modal is open, re-render it
      const favModal = document.getElementById('favorites-modal');
      if (favModal && favModal.classList.contains('active')) {
        window.renderFavoritesList();
      }

      window.showToast(res.message);
    }
  };

  // Open Liked Songs Modal
  window.openFavoritesModal = async function () {
    const modal = document.getElementById('favorites-modal');
    if (!modal) return;
    await window.loadFavoriteSongs();
    window.renderFavoritesList();
    modal.classList.add('active');
  };

  window.renderFavoritesList = function () {
    const countLbl = document.getElementById('favorites-count-label');
    const tbody = document.getElementById('favorites-tracks-tbody');
    if (!tbody) return;

    if (countLbl) {
      countLbl.textContent = `${window.favoriteSongs.length} song${window.favoriteSongs.length === 1 ? '' : 's'}`;
    }

    if (window.favoriteSongs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
            <i class="fa-regular fa-heart" style="font-size: 32px; color: var(--primary-pink); margin-bottom: 10px; display: block;"></i>
            No liked songs yet!<br>
            <span style="font-size: 13px; color: var(--text-dim);">Click the ❤️ heart icon on any song to save it to your Favorites.</span>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = '';
    window.favoriteSongs.forEach((song, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color: var(--text-dim);">${idx + 1}</td>
        <td>
          <div class="track-title-cell">
            <img src="${song.coverUrl || 'assets/images/study_mix.jpg'}" class="track-thumb" alt="art" />
            <div>
              <div style="font-weight: 700; color: #ffffff;">${song.title}</div>
              <div style="font-size: 12px; color: var(--text-muted);">${song.artist}</div>
            </div>
          </div>
        </td>
        <td style="color: var(--text-muted); font-size: 13px;">${song.album || 'VibeFlow'}</td>
        <td><span class="badge-genre">${song.genre || 'Music'}</span></td>
        <td style="color: var(--text-dim); font-size: 13px;">${window.player.formatTime(song.duration || 180)}</td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn-table-heart active" data-title="${song.title}" title="Remove from Liked Songs">
            <i class="fa-solid fa-heart"></i>
          </button>
          <button class="track-table-play-btn" title="Play Track">
            <i class="fas fa-play" style="margin-left: 2px;"></i>
          </button>
        </td>
      `;

      // Click heart
      tr.querySelector('.btn-table-heart').addEventListener('click', (e) => {
        e.stopPropagation();
        window.toggleSongFavorite(song);
      });

      // Click play button
      tr.querySelector('.track-table-play-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        window.player.loadTrack(song, true);
        window.showToast(`▶ Now playing: ${song.title}`);
        window.closeModals();
      });

      // Click row
      tr.addEventListener('click', () => {
        window.player.loadTrack(song, true);
        window.showToast(`▶ Now playing: ${song.title}`);
        window.closeModals();
      });

      tbody.appendChild(tr);
    });
  };

  // Play All Liked Songs
  document.getElementById('btn-play-all-favorites')?.addEventListener('click', () => {
    if (window.favoriteSongs && window.favoriteSongs.length > 0) {
      const favPlaylist = {
        title: 'Liked Songs',
        slug: 'liked-songs',
        category: 'Favorites',
        songs: window.favoriteSongs,
      };
      window.player.loadPlaylist(favPlaylist, 0, true);
      window.showToast(`▶ Playing all ${window.favoriteSongs.length} Liked Songs!`);
      window.closeModals();
    } else {
      window.showToast('No liked songs yet! Click ❤️ to add songs.');
    }
  });

  // ==========================================
  // Playlist Detail & Add Custom Song Logic
  // ==========================================
  window.openPlaylistDetailModal = async function (playlistId) {
    const modal = document.getElementById('playlist-detail-modal');
    if (!modal) return;

    const res = await window.API.getPlaylist(playlistId);
    if (!res.success || !res.playlist) return;

    const p = res.playlist;
    window.currentViewingPlaylist = p;

    document.getElementById('detail-cover').src = p.coverImage || 'assets/images/study_mix.jpg';
    document.getElementById('detail-title').textContent = p.title;
    document.getElementById('detail-desc').textContent = p.description || 'Curated mood beats';
    document.getElementById('detail-category').textContent = p.category;
    document.getElementById('detail-count').textContent = `${p.songs ? p.songs.length : 0} songs`;

    const tbody = document.getElementById('playlist-tracks-tbody');
    if (tbody) {
      tbody.innerHTML = '';
      (p.songs || []).forEach((song, index) => {
        const isFav = window.isSongFavorited(song);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="color: var(--text-dim);">${index + 1}</td>
          <td>
            <div class="track-title-cell">
              <img src="${song.coverUrl || p.coverImage || 'assets/images/study_mix.jpg'}" class="track-thumb" alt="art" />
              <div>
                <div style="font-weight: 700; color: #ffffff;">${song.title}</div>
                <div style="font-size: 12px; color: var(--text-muted);">${song.artist}</div>
              </div>
            </div>
          </td>
          <td style="color: var(--text-muted); font-size: 13px;">${song.album || 'VibeFlow'}</td>
          <td><span class="badge-genre">${song.genre || p.category}</span></td>
          <td style="color: var(--text-dim); font-size: 13px;">${window.player.formatTime(song.duration || 180)}</td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn-table-heart ${isFav ? 'active' : ''}" data-title="${song.title}" title="${isFav ? 'Remove from Liked Songs' : 'Add to Liked Songs'}">
              <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            <button class="btn-table-delete" data-title="${song.title}" title="Delete this song">
              <i class="fa-solid fa-trash-can"></i>
            </button>
            <button class="track-table-play-btn" title="Play Track">
              <i class="fas fa-play" style="margin-left: 2px;"></i>
            </button>
          </td>
        `;

        tr.querySelector('.btn-table-heart').addEventListener('click', (e) => {
          e.stopPropagation();
          window.toggleSongFavorite(song);
        });

        tr.querySelector('.btn-table-delete').addEventListener('click', async (e) => {
          e.stopPropagation();
          const songId = song._id || song.songId || song.id;
          if (confirm(`🗑️ Are you sure you want to delete "${song.title}" from ${p.title}?`)) {
            const delRes = await window.API.deleteSongFromPlaylist(p._id, songId);
            if (delRes.success) {
              window.showToast(`🗑️ "${song.title}" deleted.`);
              await loadPlaylists();
              window.openPlaylistDetailModal(p._id);
            } else {
              window.showToast(delRes.message || 'Failed to delete song.');
            }
          }
        });

        tr.querySelector('.track-table-play-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          window.player.loadPlaylist(p, index, true);
          window.showToast(`▶ Now playing: ${song.title}`);
        });

        tr.addEventListener('click', () => {
          window.player.loadPlaylist(p, index, true);
          window.showToast(`▶ Now playing: ${song.title}`);
        });

        tbody.appendChild(tr);
      });
    }

    modal.classList.add('active');
  };

  // Open Add Song Modal
  window.openAddSongModal = function () {
    const modal = document.getElementById('add-song-modal');
    const select = document.getElementById('add-song-category-select');
    if (!modal) return;

    if (select && window.allPlaylists) {
      select.innerHTML = '';
      window.allPlaylists.forEach((p) => {
        const opt = document.createElement('option');
        opt.value = p._id;
        opt.textContent = `${p.title} (${p.category})`;
        if (window.currentViewingPlaylist && window.currentViewingPlaylist._id === p._id) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    }

    modal.classList.add('active');
  };

  // Submit Add Song Form
  document.getElementById('add-song-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const playlistId = document.getElementById('add-song-category-select').value;
    const title = document.getElementById('add-song-title').value;
    const artist = document.getElementById('add-song-artist').value;
    const album = document.getElementById('add-song-album').value;
    const audioUrl = document.getElementById('add-song-url').value;
    const rawDuration = document.getElementById('add-song-duration')?.value?.trim();

    // Parse duration (e.g. 3:45 -> 225s, or numeric seconds)
    let parsedDuration = 210;
    if (rawDuration) {
      if (rawDuration.includes(':')) {
        const parts = rawDuration.split(':');
        const mins = parseInt(parts[0], 10) || 0;
        const secs = parseInt(parts[1], 10) || 0;
        parsedDuration = mins * 60 + secs;
      } else if (!isNaN(parseInt(rawDuration, 10))) {
        parsedDuration = parseInt(rawDuration, 10);
      }
    }

    // Check for YouTube Link & set cover thumbnail
    let coverUrl = 'assets/images/study_mix.jpg';
    if (window.currentViewingPlaylist && window.currentViewingPlaylist.coverImage) {
      coverUrl = window.currentViewingPlaylist.coverImage;
    }
    const ytMatch = (audioUrl || '').match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      coverUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    }

    const res = await window.API.addSongToPlaylist(playlistId, {
      title,
      artist,
      album,
      audioUrl,
      coverUrl,
      duration: parsedDuration,
    });

    if (res.success) {
      window.showToast(`🎉 "${title}" added successfully!`);
      document.getElementById('add-song-modal').classList.remove('active');
      document.getElementById('add-song-form').reset();

      // Refresh playlists
      await loadPlaylists();
      if (window.currentViewingPlaylist) {
        window.openPlaylistDetailModal(playlistId);
      }
    } else {
      window.showToast(res.message || 'Failed to add song.');
    }
  });

  // Update UI with User Profile Data
  window.updateUserUI = function (user) {
    window.currentUser = user;
    const authActions = document.getElementById('auth-actions');
    const sidebarStreakVal = document.getElementById('sidebar-streak-days');
    const sidebarStarsVal = document.getElementById('sidebar-today-stars');

    if (sidebarStreakVal) sidebarStreakVal.textContent = `🔥 ${user.currentStreak || 4}`;
    if (sidebarStarsVal) sidebarStarsVal.textContent = `⭐ ${user.starsToday || 3}`;

    if (authActions) {
      authActions.innerHTML = `
        <div class="user-profile-badge" id="btn-open-profile">
          <img src="${user.avatar || 'assets/images/study_mix.jpg'}" class="user-avatar-img" alt="avatar" />
          <span class="user-name-text">${user.username || 'Student'}</span>
          <span style="color: #ffeb3b; font-size: 13px; font-weight: 700;">⭐ ${user.starsToday || 3}</span>
        </div>
      `;

      document.getElementById('btn-open-profile')?.addEventListener('click', () => {
        window.dashboard.open();
      });
    }
  };

  // Mobile Navigation Drawer Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  function toggleMobileMenu(open) {
    if (sidebar) sidebar.classList.toggle('mobile-open', open);
    if (sidebarOverlay) sidebarOverlay.classList.toggle('active', open);
  }

  mobileMenuBtn?.addEventListener('click', () => {
    const isOpen = sidebar?.classList.contains('mobile-open');
    toggleMobileMenu(!isOpen);
  });

  sidebarOverlay?.addEventListener('click', () => toggleMobileMenu(false));

  // Auto-close mobile drawer when tapping any navigation link
  document.querySelectorAll('.sidebar .nav-link, .sidebar-streak-card').forEach((el) => {
    el.addEventListener('click', () => toggleMobileMenu(false));
  });

  // Bind Header & Sidebar Buttons
  document.getElementById('btn-login')?.addEventListener('click', () => window.openAuthModal(false));
  document.getElementById('btn-register')?.addEventListener('click', () => window.openAuthModal(true));
  document.getElementById('btn-explore')?.addEventListener('click', () => {
    document.getElementById('playlists-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btn-open-add-song')?.addEventListener('click', () => {
    window.openAddSongModal();
  });

  document.getElementById('btn-detail-add-song')?.addEventListener('click', () => {
    window.openAddSongModal();
  });

  document.getElementById('btn-detail-play-all')?.addEventListener('click', () => {
    if (window.currentViewingPlaylist) {
      window.player.loadPlaylist(window.currentViewingPlaylist, 0, true);
      window.showToast(`▶ Playing ${window.currentViewingPlaylist.title}`);
    }
  });

  document.getElementById('sidebar-streak-card')?.addEventListener('click', () => {
    window.dashboard.open();
  });

  document.getElementById('nav-studymix')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.openFocusModal();
  });

  document.getElementById('nav-favorites')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.openFavoritesModal();
  });

  document.getElementById('nav-history')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.openRecentlyPlayedModal();
  });

  document.getElementById('nav-settings')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.openSettingsModal();
  });

  // Modal Close buttons
  document.querySelectorAll('.modal-close, .btn-modal-close').forEach((btn) => {
    btn.addEventListener('click', () => window.closeModals());
  });

  // Close modals when clicking overlay background
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) window.closeModals();
    });
  });

  // Handle Auth Form Submission
  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      const username = document.getElementById('auth-username').value;
      const isRegister = document.getElementById('auth-username-group').style.display !== 'none';

      let res;
      if (isRegister) {
        res = await window.API.register(username, email, password);
      } else {
        res = await window.API.login(email, password);
      }

      if (res.success && res.user) {
        window.updateUserUI(res.user);
        window.closeModals();
        window.showToast(`🎉 Welcome back, ${res.user.username}!`);
      } else {
        window.showToast(res.message || 'Authentication error.');
      }
    });
  }

  // Quick Demo Login Button
  document.getElementById('btn-demo-login')?.addEventListener('click', async () => {
    const res = await window.API.login('alex@student.edu', 'password123');
    if (res.success && res.user) {
      window.updateUserUI(res.user);
      window.closeModals();
      window.showToast('✅ Logged in as Demo Student (Alex)!');
    }
  });

  // ==========================================
  // Real-Time All-Songs Search (Across All Categories)
  // ==========================================
  const searchInput = document.getElementById('search-input');
  const searchDropdown = document.getElementById('search-results-dropdown');

  if (searchInput && searchDropdown) {
    let searchDebounce = null;

    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.trim();
      clearTimeout(searchDebounce);

      if (!term) {
        searchDropdown.classList.remove('active');
        searchDropdown.innerHTML = '';
        return;
      }

      searchDebounce = setTimeout(async () => {
        const res = await window.API.searchSongs(term);
        if (res.success && res.songs && res.songs.length > 0) {
          searchDropdown.innerHTML = `
            <div class="search-dropdown-header">
              <i class="fa-solid fa-magnifying-glass"></i> Matching Songs (${res.songs.length})
            </div>
          `;

          res.songs.forEach((song) => {
            const isFav = window.isSongFavorited(song);
            const item = document.createElement('div');
            item.className = 'search-song-item';
            item.innerHTML = `
              <div class="search-song-left">
                <img src="${song.coverUrl || 'assets/images/study_mix.jpg'}" class="search-song-thumb" alt="art" />
                <div class="search-song-info">
                  <span class="search-song-title">${song.title}</span>
                  <span class="search-song-artist">${song.artist} • ${song.album || 'VibeFlow'}</span>
                </div>
              </div>
              <div class="search-song-right">
                <span class="badge-genre">${song.genre || 'Music'}</span>
                <span style="font-size: 12px; color: var(--text-dim);">${window.player.formatTime(song.duration || 180)}</span>
                <button class="btn-table-heart ${isFav ? 'active' : ''}" data-title="${song.title}" title="${isFav ? 'Remove from Liked Songs' : 'Add to Liked Songs'}">
                  <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>
                <button class="search-play-btn" title="Play ${song.title}">
                  <i class="fas fa-play" style="margin-left: 1px;"></i>
                </button>
              </div>
            `;

            // Click heart button
            item.querySelector('.btn-table-heart').addEventListener('click', (ev) => {
              ev.stopPropagation();
              window.toggleSongFavorite(song);
            });

            // Click play button
            item.querySelector('.search-play-btn').addEventListener('click', (ev) => {
              ev.stopPropagation();
              window.player.loadTrack(song, true);
              window.showToast(`▶ Now playing: ${song.title}`);
              searchDropdown.classList.remove('active');
            });

            // Click entire row
            item.addEventListener('click', () => {
              window.player.loadTrack(song, true);
              window.showToast(`▶ Now playing: ${song.title}`);
              searchDropdown.classList.remove('active');
            });

            searchDropdown.appendChild(item);
          });

          searchDropdown.classList.add('active');
        } else {
          searchDropdown.innerHTML = `
            <div class="search-no-results">
              <i class="fa-solid fa-music" style="font-size: 24px; color: var(--text-dim); margin-bottom: 8px; display: block;"></i>
              No songs found matching "<strong>${term}</strong>".<br>
              <span style="font-size: 12px; color: var(--text-dim);">Try searching by artist, title, or genre.</span>
            </div>
          `;
          searchDropdown.classList.add('active');
        }
      }, 200);
    });

    // Close search dropdown on clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.remove('active');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchDropdown.classList.remove('active');
      }
    });
  }

  // Fetch Playlists from Backend API
  async function loadPlaylists() {
    const res = await window.API.getPlaylists();
    if (res.success && res.playlists) {
      window.allPlaylists = res.playlists;
      renderPlaylists(res.playlists);

      // Load initial track from Study Mix into bottom player
      const studyMix = res.playlists.find((p) => p.slug === 'study-mix') || res.playlists[0];
      if (studyMix && studyMix.songs && studyMix.songs.length > 0) {
        window.player.loadPlaylist(studyMix, 0, false);
      }
    }
  }

  // Render Playlist Cards into the Grid (Exact match to screenshot)
  function renderPlaylists(playlists) {
    const grid = document.getElementById('playlists-grid');
    if (!grid) return;
    grid.innerHTML = '';

    playlists.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'playlist-card';
      card.dataset.id = p._id;

      const isStudyMix = p.slug === 'study-mix' || p.isFocusMode;
      const songCount = p.songs ? p.songs.length : 0;

      card.innerHTML = `
        <div class="card-image-wrap">
          <img src="${p.coverImage || 'assets/images/study_mix.jpg'}" alt="${p.title}" loading="lazy" />
          ${isStudyMix ? `<div class="focus-badge-tag">⭐ FOCUS 30M</div>` : ''}
          <button class="card-play-btn" title="Play ${p.title}">
            <i class="fas fa-play" style="margin-left: 2px;"></i>
          </button>
        </div>
        <div class="card-title">${p.title}</div>
        <div class="card-desc">${songCount} songs • ${p.category}</div>
      `;

      // Play button click
      const playBtn = card.querySelector('.card-play-btn');
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.player.loadPlaylist(p, 0, true);
        if (isStudyMix) {
          window.openFocusModal();
        } else {
          window.showToast(`▶ Now playing: ${p.title}`);
        }
      });

      // Card click opens full playlist tracks & songs list
      card.addEventListener('click', () => {
        window.openPlaylistDetailModal(p._id || p.slug);
      });

      grid.appendChild(card);
    });
  }

  // Load Current User Profile
  async function loadUserProfile() {
    const res = await window.API.getMe();
    if (res.success && res.user) {
      window.updateUserUI(res.user);
    }
  }

  // Initialize
  await window.loadFavoriteSongs();
  await loadPlaylists();
  await loadUserProfile();
});
