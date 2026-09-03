// VibeFlow Study Mix Focus Timer & Gamification Rewards Engine
// Strictly 30-Minute Automatic Star Reward Engine

class FocusTimer {
  constructor() {
    this.totalDuration = 30 * 60; // Strictly 30 minutes (1800 seconds)
    this.remainingSeconds = this.totalDuration;
    this.timerInterval = null;
    this.isRunning = false;
    this.circleCircumference = 2 * Math.PI * 110; // r=110 => ~691

    this.initUI();
  }

  initUI() {
    this.digitsEl = document.getElementById('timer-digits');
    this.progressCircle = document.getElementById('timer-progress-ring');
    this.startBtn = document.getElementById('btn-timer-toggle');
    this.resetBtn = document.getElementById('btn-timer-reset');
    this.miniIndicator = document.getElementById('mini-focus-indicator');
    this.miniTime = document.getElementById('mini-focus-time');

    if (this.progressCircle) {
      this.progressCircle.style.strokeDasharray = `${this.circleCircumference}`;
      this.progressCircle.style.strokeDashoffset = '0';
    }

    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => this.toggleTimer());
    }

    if (this.miniIndicator) {
      this.miniIndicator.addEventListener('click', () => {
        window.openFocusModal?.();
      });
    }

    this.updateDisplay();
  }

  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer(true);
    } else {
      this.startTimer(true);
      if (window.player && !window.player.isPlaying) {
        window.player.play();
      }
    }
  }

  startTimer(autoPlayMusic = true) {
    if (this.isRunning) return;

    // If starting timer from modal and player is not playing study mix, switch to Study Mix & Play
    if (autoPlayMusic && window.player) {
      const isCurrentlyStudy = window.player.isStudyTrack?.(window.player.currentTrack);
      if (!isCurrentlyStudy) {
        const studyPlaylist = window.allPlaylists?.find((p) => p.slug === 'study-mix') || window.allPlaylists?.[0];
        if (studyPlaylist) {
          window.player.loadPlaylist(studyPlaylist, 0, true);
        }
      } else if (!window.player.isPlaying) {
        window.player.play();
      }
    }

    this.isRunning = true;

    if (this.startBtn) {
      this.startBtn.innerHTML = '<i class="fas fa-pause"></i> Pause Study Session';
      this.startBtn.style.backgroundColor = '#d81b60';
    }

    if (this.miniIndicator) {
      this.miniIndicator.style.display = 'flex';
    }

    this.timerInterval = setInterval(() => {
      // Check if user paused or switched away from Study Mix
      if (window.player) {
        const isStudy = window.player.isStudyTrack?.(window.player.currentTrack);
        if (!window.player.isPlaying || !isStudy) {
          this.pauseTimer(false);
          if (!isStudy && this.miniIndicator) {
            this.miniIndicator.style.display = 'none';
          }
          return;
        }
      }

      if (this.remainingSeconds > 0) {
        this.remainingSeconds -= 1;
        this.updateDisplay();
      } else {
        // 30 Minutes completed automatically!
        this.completeSession();
      }
    }, 1000);
  }

  pauseTimer(pauseMusic = false) {
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (pauseMusic && window.player && window.player.isPlaying) {
      window.player.pause();
    }

    if (this.startBtn) {
      this.startBtn.innerHTML = '<i class="fas fa-play"></i> Resume Focus';
      this.startBtn.style.backgroundColor = 'var(--primary-magenta)';
    }
  }

  resetTimer() {
    this.pauseTimer(true);
    this.totalDuration = 30 * 60;
    this.remainingSeconds = this.totalDuration;
    if (this.startBtn) {
      this.startBtn.innerHTML = '<i class="fas fa-play"></i> Start 30-Min Focus';
      this.startBtn.style.backgroundColor = 'var(--primary-magenta)';
    }
    this.updateDisplay();
  }

  updateDisplay() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (this.digitsEl) {
      this.digitsEl.textContent = timeStr;
    }
    if (this.miniTime) {
      this.miniTime.textContent = timeStr;
    }

    if (this.progressCircle) {
      const progressPercent = (this.totalDuration - this.remainingSeconds) / this.totalDuration;
      const offset = this.circleCircumference * (1 - progressPercent);
      this.progressCircle.style.strokeDashoffset = `${offset}`;
    }
  }

  async completeSession() {
    this.pauseTimer(false);
    this.remainingSeconds = 0;
    this.updateDisplay();

    // Play celebration audio chime
    this.playCelebrationSound();

    // Automatically award 1 Star for 30 minutes in MongoDB
    const res = await window.API.completeFocusSession(30, '66b200000000000000000001');

    if (res.success) {
      // Update global user stats in UI
      if (res.user) {
        window.updateUserUI?.(res.user);
      }

      // Show Star Celebration Modal
      this.showCelebrationModal(res.starsEarned || 1, res.user);
      window.showToast?.('🎉 30 minutes completed! +1 ⭐ Star Earned!');
    } else {
      window.showToast?.('Session completed!');
    }

    // Reset back to 30:00 for the next focus block
    this.resetTimer();
  }

  showCelebrationModal(starsEarned, user) {
    const modal = document.getElementById('star-celebration-modal');
    if (!modal) return;

    const countEl = document.getElementById('earned-stars-count');
    const streakEl = document.getElementById('celebration-streak-val');
    const todayStarsEl = document.getElementById('celebration-today-stars');

    if (countEl) countEl.textContent = `+${starsEarned} ⭐ Star Earned!`;
    if (streakEl) streakEl.textContent = `🔥 ${user?.currentStreak || 1} Days`;
    if (todayStarsEl) todayStarsEl.textContent = `⭐ ${user?.starsToday || 1} Today`;

    modal.classList.add('active');
  }

  playCelebrationSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + i * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.8);
      });
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }
}

window.FocusTimer = FocusTimer;
