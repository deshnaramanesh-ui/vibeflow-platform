// VibeFlow API Service Layer

const API = {
  baseUrl: window.location.origin,

  getToken() {
    return localStorage.getItem('vibeflow_token');
  },

  setToken(token) {
    localStorage.setItem('vibeflow_token', token);
  },

  clearToken() {
    localStorage.removeItem('vibeflow_token');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
      return await response.json();
    } catch (error) {
      console.warn(`API request to ${endpoint} failed:`, error);
      return { success: false, message: error.message };
    }
  },

  // Playlists
  async getPlaylists() {
    return this.request('/api/playlists');
  },

  async getPlaylist(id) {
    return this.request(`/api/playlists/${id}`);
  },

  async addSongToPlaylist(playlistId, songData) {
    return this.request(`/api/playlists/${playlistId}/songs`, {
      method: 'POST',
      body: JSON.stringify(songData),
    });
  },

  async deleteSongFromPlaylist(playlistId, songId) {
    return this.request(`/api/playlists/${playlistId}/songs/${songId}`, {
      method: 'DELETE',
    });
  },

  async searchSongs(query) {
    return this.request(`/api/playlists/search/songs?q=${encodeURIComponent(query)}`);
  },

  // Auth
  async login(email, password) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.success && res.token) {
      this.setToken(res.token);
    }
    return res;
  },

  async register(username, email, password) {
    const res = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    if (res.success && res.token) {
      this.setToken(res.token);
    }
    return res;
  },

  async updateAccount(accountData) {
    return this.request('/api/auth/update-account', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  },

  async getMe() {
    return this.request('/api/auth/me');
  },

  // Focus & Stars
  async completeFocusSession(durationMinutes, playlistId) {
    return this.request('/api/focus/complete-session', {
      method: 'POST',
      body: JSON.stringify({ durationMinutes, playlistId }),
    });
  },

  async triggerDemoReward() {
    return this.request('/api/focus/demo-reward', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async getFocusStats(userId) {
    return this.request(`/api/focus/stats/${userId || '66c300000000000000000001'}`);
  },

  async resetStars(userId) {
    return this.request('/api/focus/reset-stars', {
      method: 'POST',
      body: JSON.stringify({ userId: userId || '66c300000000000000000001' }),
    });
  },

  // Recently Played History
  async getRecentlyPlayed(userId) {
    return this.request(`/api/users/history?userId=${userId || '66c300000000000000000001'}`);
  },

  async recordSongPlayed(song, userId) {
    return this.request('/api/users/history', {
      method: 'POST',
      body: JSON.stringify({ song, userId: userId || '66c300000000000000000001' }),
    });
  },

  // Spotify-Style Settings
  async getUserSettings(userId) {
    return this.request(`/api/users/settings?userId=${userId || '66c300000000000000000001'}`);
  },

  async updateUserSettings(settings, userId) {
    return this.request('/api/users/settings', {
      method: 'POST',
      body: JSON.stringify({ settings, userId: userId || '66c300000000000000000001' }),
    });
  },

  // Liked / Favorite Songs
  async toggleFavoriteSong(song, userId) {
    return this.request('/api/users/favorite-songs/toggle', {
      method: 'POST',
      body: JSON.stringify({ song, userId: userId || '66c300000000000000000001' }),
    });
  },

  async getFavoriteSongs(userId) {
    return this.request(`/api/users/favorite-songs?userId=${userId || '66c300000000000000000001'}`);
  },

  // Favorites
  async toggleFavorite(playlistId) {
    return this.request('/api/users/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({ playlistId }),
    });
  },
};

window.API = API;
