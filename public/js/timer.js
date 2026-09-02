// VibeFlow Study Mix Focus Timer & Gamification Rewards Engine

class FocusTimer {
  constructor() {
    this.totalDuration = 30 * 60; // 30 minutes in seconds
    this.remainingSeconds = this.totalDuration;
    this.timerInterval = null;
    this.isRunning = false;
    this.activeMode = 30; // in minutes
    this.circleCircumference = 2 * Math.PI * 110; // r=110 => ~691

    this.initUI();
  }

  initUI() {
    this.digitsEl = document.getElementById('timer-digits');
    this.progressCircle = document.getElementById('timer-progress-ring');
    this.startBtn = document.getElementById('btn-timer-toggle');
    this.resetBtn = document.getElementById('btn-timer-reset');
    this.claimBtn = document.getElementById('btn-timer-claim');
    this.modeChips = document.querySelectorAll('.mode-chip');
    this.miniIndicator = document.getElementById('mini-focus-indicator');
    this.miniTime = document.getElementById('mini-focus-time');

    if (this.progressCircle) {
      this.progressCircle.style.strokeDasharray = `${this.circleCircumference}`;
      this.progressCircle.style.strokeDashoffset = '0';
    }

    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => this.toggleTimer());
    }
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.resetTimer());
    }
    if (this.claimBtn) {
      this.claimBtn.addEventListener('click', () => this.completeSession(true));
    }

    this.modeChips.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        this.modeChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const mins = Number(chip.dataset.mins);
        this.setMode(mins);
      });
    });

    if (this.miniIndicator) {
      this.miniIndicator.addEventListener('click', () => {
        window.openFocusModal?.();
      });
    }

    this.updateDisplay();
  }

  setMode(minutes) {
    this.pauseTimer();
    this.activeMode = minutes;
    // If demo mode (0.083 mins = 5 secs)
    if (minutes < 1) {
      this.totalDuration = 5;
    } else {
      this.totalDuration = minutes * 60;
    }
    this.remainingSeconds = this.totalDuration;
    this.updateDisplay();
  }

  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Also auto-play Study Mix music if not already playing
    if (window.player && !window.player.isPlaying) {
      const studyPlaylist = window.allPlaylists?.find((p) => p.slug === 'study-mix') || window.allPlaylists?.[0];
      if (studyPlaylist) {
        window.player.loadPlaylist(studyPlaylist, 0, true);
      }
    }

    if (this.startBtn) {
      this.startBtn.innerHTML = '<i class="fas fa-pause"></i> Pause Study Session';
      this.startBtn.style.backgroundColor = '#d81b60';
    }

    if (this.miniIndicator) {
      this.miniIndicator.style.display = 'flex';
    }

    this.timerInterval = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds -= 1;
        this.updateDisplay();
      } else {
        this.completeSession();
      }
    }, 1000);
  }

  pauseTimer() {
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.startBtn) {
      this.startBtn.innerHTML = '<i class="fas fa-play"></i> Resume Focus';
      this.startBtn.style.backgroundColor = 'var(--primary-magenta)';
    }
  }

  resetTimer() {
    this.pauseTimer();
    if (this.activeMode < 1) {
      this.totalDuration = 5;
    } else {
      this.totalDuration = this.activeMode * 60;
    }
    this.remainingSeconds = this.totalDuration;
    if (this.startBtn) {
      this.startBtn.innerHTML = '<i class="fas fa-play"></i> Start 30-Min Focus';
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

  async completeSession(manualClaim = false) {
    this.pauseTimer();
    this.remainingSeconds = 0;
    this.updateDisplay();

    // Play celebration audio chime
    this.playCelebrationSound();

    // Call API backend to record session in MongoDB and award Star ⭐
    const duration = this.activeMode < 1 ? 30 : this.activeMode;
    const res = await window.API.completeFocusSession(duration, '66b200000000000000000001');

    if (res.success) {
      // Update global user stats in UI
      if (res.user) {
        window.updateUserUI?.(res.user);
      }

      // Show Star Celebration Modal
      this.showCelebrationModal(res.starsEarned || 1, res.user);
    } else {
      window.showToast?.('Session recorded!');
    }

    this.resetTimer();
  }

  showCelebrationModal(starsEarned, user) {
    const modal = document.getElementById('star-celebration-modal');
    if (!modal) return;

    document.getElementById('earned-stars-count').textContent = `+${starsEarned} ⭐ Star Earned!`;
    document.getElementById('celebration-streak-val').textContent = `🔥 ${user?.currentStreak || 4} Days`;
    document.getElementById('celebration-today-stars').textContent = `⭐ ${user?.starsToday || 4} Today`;

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
