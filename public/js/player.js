// VibeFlow Interactive Music Player & Audio Engine
// Supports HTML5 Audio, Direct YouTube Audio Streams & Multi-Mood Procedural Synthesizer

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

// Global YouTube Player Initialization
window.isYtReady = false;
window.onYouTubeIframeAPIReady = function () {
  try {
    window.ytPlayer = new YT.Player('youtube-iframe-target', {
      height: '1',
      width: '1',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
        playsinline: 1,
      },
      events: {
        onReady: () => {
          window.isYtReady = true;
          if (window.player && window.player.pendingYtId) {
            window.player.playYouTubeTrack(window.player.pendingYtId, true);
            window.player.pendingYtId = null;
          }
        },
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.PLAYING) {
            window.player?.updatePlayState(true);
          } else if (event.data === YT.PlayerState.PAUSED) {
            window.player?.updatePlayState(false);
          } else if (event.data === YT.PlayerState.ENDED) {
            window.player?.playNext();
          }
        },
        onError: (err) => {
          console.warn('YouTube playback error, activating mood synth:', err);
          window.player?.startLofiSynth(window.player.currentTrack?.genre);
        },
      },
    });
  } catch (e) {
    console.warn('YT Iframe init error:', e);
  }
};

class MusicPlayer {
  constructor() {
    this.audio = new Audio();
    this.currentTrack = null;
    this.currentPlaylist = null;
    this.queue = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.8;
    this.isSynthesizing = false;

    // YouTube playback state
    this.isYouTube = false;
    this.pendingYtId = null;
    this.ytTimeInterval = null;

    // Web Audio Synthesizer fallback
    this.audioCtx = null;
    this.synthInterval = null;

    this.initAudioListeners();
    this.initUIElements();
  }

  initAudioListeners() {
    this.audio.addEventListener('loadedmetadata', () => {
      if (this.audio.duration && !isNaN(this.audio.duration) && isFinite(this.audio.duration)) {
        if (this.elements.totalTime) {
          this.elements.totalTime.textContent = this.formatTime(this.audio.duration);
        }
        if (this.currentTrack) {
          this.currentTrack.duration = Math.round(this.audio.duration);
        }
      }
    });

    this.audio.addEventListener('durationchange', () => {
      if (this.audio.duration && !isNaN(this.audio.duration) && isFinite(this.audio.duration)) {
        if (this.elements.totalTime) {
          this.elements.totalTime.textContent = this.formatTime(this.audio.duration);
        }
      }
    });

    this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.audio.addEventListener('ended', () => this.playNext());
    this.audio.addEventListener('play', () => this.updatePlayState(true));
    this.audio.addEventListener('pause', () => this.updatePlayState(false));
    this.audio.addEventListener('error', (e) => {
      console.warn('Audio stream error, activating mood synth:', e);
      this.startLofiSynth(this.currentTrack ? this.currentTrack.genre : 'Study');
    });
  }

  initUIElements() {
    this.elements = {
      cover: document.getElementById('player-cover'),
      title: document.getElementById('player-title'),
      artist: document.getElementById('player-artist'),
      playBtn: document.getElementById('btn-play-toggle'),
      prevBtn: document.getElementById('btn-prev-track'),
      nextBtn: document.getElementById('btn-next-track'),
      scrubberBar: document.getElementById('scrubber-bar'),
      scrubberFill: document.getElementById('scrubber-fill'),
      currentTime: document.getElementById('current-time-label'),
      totalTime: document.getElementById('total-time-label'),
      volumeSlider: document.getElementById('volume-slider'),
      heartBtn: document.getElementById('player-heart-btn'),
    };

    if (this.elements.playBtn) {
      this.elements.playBtn.addEventListener('click', () => this.togglePlay());
    }
    if (this.elements.prevBtn) {
      this.elements.prevBtn.addEventListener('click', () => this.playPrev());
    }
    if (this.elements.nextBtn) {
      this.elements.nextBtn.addEventListener('click', () => this.playNext());
    }
    if (this.elements.volumeSlider) {
      this.elements.volumeSlider.addEventListener('input', (e) => {
        this.setVolume(e.target.value / 100);
      });
    }
    if (this.elements.scrubberBar) {
      this.elements.scrubberBar.addEventListener('click', (e) => this.seek(e));
    }
    if (this.elements.heartBtn) {
      this.elements.heartBtn.addEventListener('click', () => {
        if (this.currentTrack && window.toggleSongFavorite) {
          window.toggleSongFavorite(this.currentTrack);
        }
      });
    }
  }

  updateHeartState(track) {
    if (!this.elements.heartBtn || !track) return;
    const isFav = window.isSongFavorited ? window.isSongFavorited(track) : false;
    if (isFav) {
      this.elements.heartBtn.classList.add('active');
      this.elements.heartBtn.innerHTML = '<i class="fa-solid fa-heart" style="color: #ff007f;"></i>';
      this.elements.heartBtn.title = 'Remove from Liked Songs';
    } else {
      this.elements.heartBtn.classList.remove('active');
      this.elements.heartBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
      this.elements.heartBtn.title = 'Add to Liked Songs';
    }
  }

  loadPlaylist(playlist, startIndex = 0, autoPlay = true) {
    if (!playlist || !playlist.songs || playlist.songs.length === 0) return;
    this.currentPlaylist = playlist;
    this.queue = playlist.songs;
    this.currentIndex = startIndex;
    this.loadTrack(this.queue[this.currentIndex], autoPlay);
  }

  loadTrack(track, autoPlay = true) {
    if (!track) return;
    this.currentTrack = track;
    this.stopLofiSynth();

    const ytId = getYouTubeId(track.audioUrl);

    // Update UI elements
    if (this.elements.cover) {
      if (ytId) {
        this.elements.cover.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      } else {
        this.elements.cover.src = track.coverUrl || 'assets/images/study_mix.jpg';
      }
    }
    if (this.elements.title) {
      this.elements.title.textContent = track.title || 'Focus Beat';
    }
    if (this.elements.artist) {
      this.elements.artist.textContent = track.artist || 'VibeFlow';
    }
    if (this.elements.totalTime) {
      this.elements.totalTime.textContent = this.formatTime(track.duration || 180);
    }

    this.updateHeartState(track);

    // Record in Recently Played History
    if (window.API && window.API.recordSongPlayed) {
      window.API.recordSongPlayed(track).catch(() => {});
    }

    // Branch between YouTube Streaming & HTML5 Audio
    if (ytId) {
      this.isYouTube = true;
      this.audio.pause();
      this.audio.src = '';
      this.playYouTubeTrack(ytId, autoPlay);
    } else {
      this.isYouTube = false;
      if (window.ytPlayer && window.ytPlayer.stopVideo) {
        try { window.ytPlayer.stopVideo(); } catch (e) {}
      }
      if (this.ytTimeInterval) {
        clearInterval(this.ytTimeInterval);
        this.ytTimeInterval = null;
      }
      this.audio.src = track.audioUrl || '';
      this.audio.load();

      if (autoPlay) {
        this.play();
      }
    }
  }

  playYouTubeTrack(ytId, autoPlay = true) {
    if (window.ytPlayer && window.isYtReady && window.ytPlayer.loadVideoById) {
      try {
        window.ytPlayer.loadVideoById(ytId);
        window.ytPlayer.setVolume(this.volume * 100);
        if (autoPlay) {
          window.ytPlayer.playVideo();
          this.updatePlayState(true);
        }
        this.startYtTimeTracker();
      } catch (e) {
        console.warn('YT load error:', e);
        this.startLofiSynth(this.currentTrack?.genre);
      }
    } else {
      this.pendingYtId = ytId;
    }
  }

  startYtTimeTracker() {
    if (this.ytTimeInterval) clearInterval(this.ytTimeInterval);
    this.ytTimeInterval = setInterval(() => {
      if (this.isYouTube && window.ytPlayer && window.ytPlayer.getCurrentTime) {
        try {
          const cur = window.ytPlayer.getCurrentTime() || 0;
          const dur = window.ytPlayer.getDuration() || (this.currentTrack ? this.currentTrack.duration : 180);
          const percent = dur > 0 ? (cur / dur) * 100 : 0;
          if (this.elements.scrubberFill) this.elements.scrubberFill.style.width = `${percent}%`;
          if (this.elements.currentTime) this.elements.currentTime.textContent = this.formatTime(cur);
          if (this.elements.totalTime && dur > 0) this.elements.totalTime.textContent = this.formatTime(dur);
        } catch (e) {}
      }
    }, 500);
  }

  play() {
    if (this.isYouTube && window.ytPlayer && window.ytPlayer.playVideo) {
      try {
        window.ytPlayer.playVideo();
        this.updatePlayState(true);
      } catch (e) {
        this.startLofiSynth(this.currentTrack ? this.currentTrack.genre : 'Study');
      }
    } else {
      this.audio.play().then(() => {
        this.updatePlayState(true);
      }).catch(() => {
        this.startLofiSynth(this.currentTrack ? this.currentTrack.genre : 'Study');
        this.updatePlayState(true);
      });
    }
  }

  pause() {
    if (this.isYouTube && window.ytPlayer && window.ytPlayer.pauseVideo) {
      try { window.ytPlayer.pauseVideo(); } catch (e) {}
    }
    this.audio.pause();
    this.stopLofiSynth();
    this.updatePlayState(false);
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  updatePlayState(isPlaying) {
    this.isPlaying = isPlaying;
    if (this.elements.playBtn) {
      this.elements.playBtn.innerHTML = isPlaying
        ? '<i class="fas fa-pause"></i>'
        : '<i class="fas fa-play" style="margin-left: 2px;"></i>';
    }
  }

  playNext() {
    if (!this.queue || this.queue.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.queue.length;
    this.loadTrack(this.queue[this.currentIndex], true);
  }

  playPrev() {
    if (!this.queue || this.queue.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
    this.loadTrack(this.queue[this.currentIndex], true);
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.audio.volume = this.volume;
    if (this.isYouTube && window.ytPlayer && window.ytPlayer.setVolume) {
      try { window.ytPlayer.setVolume(this.volume * 100); } catch (e) {}
    }
  }

  seek(event) {
    const rect = this.elements.scrubberBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));

    if (this.isYouTube && window.ytPlayer && window.ytPlayer.getDuration) {
      try {
        const dur = window.ytPlayer.getDuration() || (this.currentTrack ? this.currentTrack.duration : 180);
        const targetTime = percent * dur;
        window.ytPlayer.seekTo(targetTime, true);
        return;
      } catch (e) {}
    }

    const targetTime = percent * (this.audio.duration || (this.currentTrack ? this.currentTrack.duration : 180));
    this.audio.currentTime = targetTime;
  }

  onTimeUpdate() {
    if (this.isYouTube) return;
    const cur = this.audio.currentTime || 0;
    const dur = this.audio.duration || (this.currentTrack ? this.currentTrack.duration : 180);
    const percent = dur > 0 ? (cur / dur) * 100 : 0;

    if (this.elements.scrubberFill) {
      this.elements.scrubberFill.style.width = `${percent}%`;
    }
    if (this.elements.currentTime) {
      this.elements.currentTime.textContent = this.formatTime(cur);
    }
  }

  formatTime(seconds) {
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const remainingS = s % 60;
    return `${m.toString().padStart(2, '0')}:${remainingS.toString().padStart(2, '0')}`;
  }

  // Distinct Multi-Mood Procedural Audio Synthesizers (Unique soundscape per Category)
  startLofiSynth(genre = 'Study') {
    if (this.isSynthesizing) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      this.isSynthesizing = true;
      const g = (genre || (this.currentTrack ? this.currentTrack.genre : 'Study')).toLowerCase();

      let chords, intervalMs, oscType, baseGain, decaySec;

      if (g.includes('energy') || g.includes('edm')) {
        // Energy Boost: Fast, vibrant electronic synth chords
        chords = [
          [146.83, 220.0, 293.66, 369.99], // Dmaj
          [164.81, 246.94, 329.63, 392.0],  // Em
          [174.61, 261.63, 349.23, 440.0],  // F
          [196.0, 293.66, 392.0, 493.88],   // G
        ];
        intervalMs = 1800;
        oscType = 'sawtooth';
        baseGain = 0.02;
        decaySec = 1.6;
      } else if (g.includes('sleep') || g.includes('calm')) {
        // Sleep Sounds: Deep, peaceful delta night waves
        chords = [
          [130.81, 164.81, 196.0, 246.94], // Cmaj7 low
          [110.0, 130.81, 164.81, 196.0],  // Am7 low
          [123.47, 146.83, 174.61, 220.0], // Bm7 low
        ];
        intervalMs = 6000;
        oscType = 'sine';
        baseGain = 0.04;
        decaySec = 5.8;
      } else if (g.includes('relax') || g.includes('ambient')) {
        // Relax Beat: Ethereal ambient meditation pads
        chords = [
          [164.81, 207.65, 246.94, 329.63], // Emaj7
          [138.59, 164.81, 207.65, 246.94], // C#m7
          [220.0, 277.18, 329.63, 415.3],   // Aadd9
        ];
        intervalMs = 4500;
        oscType = 'triangle';
        baseGain = 0.035;
        decaySec = 4.2;
      } else if (g.includes('travel') || g.includes('indie')) {
        // Travel Tunes: Bright acoustic folk progression
        chords = [
          [196.0, 246.94, 293.66, 392.0],  // G
          [146.83, 220.0, 293.66, 369.99], // D
          [164.81, 196.0, 246.94, 329.63], // Em
          [130.81, 164.81, 196.0, 261.63], // C
        ];
        intervalMs = 2800;
        oscType = 'triangle';
        baseGain = 0.03;
        decaySec = 2.6;
      } else {
        // Study Mix: Warm jazz Lo-Fi piano chords
        chords = [
          [261.63, 329.63, 392.0, 493.88], // Cmaj7
          [220.0, 261.63, 329.63, 392.0],  // Am7
          [293.66, 349.23, 440.0, 523.25], // Dm7
          [196.0, 246.94, 293.66, 349.23], // G7
        ];
        intervalMs = 4000;
        oscType = 'sine';
        baseGain = 0.04;
        decaySec = 3.8;
      }

      let chordIndex = 0;

      const playChord = () => {
        if (!this.isSynthesizing) return;
        const currentChord = chords[chordIndex];
        chordIndex = (chordIndex + 1) % chords.length;

        currentChord.forEach((freq) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          const filter = this.audioCtx.createBiquadFilter();

          osc.type = oscType;
          osc.frequency.value = freq;

          filter.type = 'lowpass';
          filter.frequency.value = g.includes('energy') ? 2200 : 800;

          gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(baseGain * this.volume, this.audioCtx.currentTime + 0.8);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + decaySec);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start();
          osc.stop(this.audioCtx.currentTime + decaySec);
        });
      };

      playChord();
      this.synthInterval = setInterval(playChord, intervalMs);
    } catch (e) {
      console.warn('Synth error:', e);
    }
  }

  stopLofiSynth() {
    this.isSynthesizing = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }
}

window.MusicPlayer = MusicPlayer;
