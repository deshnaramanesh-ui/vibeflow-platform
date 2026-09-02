class StudentDashboard {
  constructor() {
    this.modal = document.getElementById('dashboard-modal');
    this.initListeners();
  }

  initListeners() {
    document.getElementById('btn-reset-stars')?.addEventListener('click', async () => {
      const res = await window.API.resetStars();
      if (res.success) {
        window.showToast('🔄 Stars & study streaks reset to 0.');
        if (res.user) {
          window.updateUserUI?.(res.user);
        }
        await this.loadAndRender();
      }
    });
  }

  async loadAndRender() {
    const res = await window.API.getFocusStats();
    if (!res.success || !res.stats) return;

    const stats = res.stats;

    // Render Metric Cards
    document.getElementById('dash-today-stars').textContent = `⭐ ${stats.starsToday}`;
    document.getElementById('dash-streak').textContent = `🔥 ${stats.currentStreak} Days`;
    document.getElementById('dash-total-focus').textContent = `${stats.totalFocusMinutes}m`;
    document.getElementById('dash-total-stars').textContent = `🌟 ${stats.totalStars}`;

    // Render Weekly Bar Chart
    const chartContainer = document.getElementById('dash-chart-bars');
    if (chartContainer && stats.weeklySummary) {
      chartContainer.innerHTML = '';
      const maxMinutes = Math.max(...stats.weeklySummary.map((d) => d.minutes), 60);

      stats.weeklySummary.forEach((dayData) => {
        const heightPct = Math.min(100, Math.round((dayData.minutes / maxMinutes) * 100));
        const col = document.createElement('div');
        col.className = 'chart-col';
        col.innerHTML = `
          <span style="font-size: 10px; color: #ffeb3b; font-weight: 700;">${dayData.stars > 0 ? `⭐${dayData.stars}` : ''}</span>
          <div class="bar-fill" style="height: ${Math.max(8, heightPct)}%;" title="${dayData.minutes} mins studied"></div>
          <span class="bar-day">${dayData.day}</span>
        `;
        chartContainer.appendChild(col);
      });
    }

    // Render Badges
    const badgesContainer = document.getElementById('dash-badges-grid');
    if (badgesContainer) {
      badgesContainer.innerHTML = '';
      const allBadges = [
        { name: 'First Star', icon: '⭐', desc: 'Completed first 30-min focus session' },
        { name: 'Streak Master', icon: '🔥', desc: 'Maintained 3+ days study streak' },
        { name: 'Lo-Fi Scholar', icon: '🎓', desc: 'Completed 2 hours in Study Mix' },
        { name: 'Daily Champion', icon: '🏆', desc: 'Earned 4+ stars in one day' },
      ];

      const unlockedNames = (stats.badges || []).map((b) => b.name);

      allBadges.forEach((b) => {
        const isUnlocked = unlockedNames.includes(b.name) || stats.starsToday >= 1;
        const item = document.createElement('div');
        item.className = `badge-item ${isUnlocked ? 'unlocked' : ''}`;
        item.style.opacity = isUnlocked ? '1' : '0.4';
        item.innerHTML = `
          <div class="badge-icon">${b.icon}</div>
          <div>
            <div class="badge-name">${b.name} ${isUnlocked ? '✓' : ''}</div>
            <div class="badge-desc">${b.desc}</div>
          </div>
        `;
        badgesContainer.appendChild(item);
      });
    }
  }

  open() {
    this.loadAndRender();
    if (this.modal) {
      this.modal.classList.add('active');
    }
  }

  close() {
    if (this.modal) {
      this.modal.classList.remove('active');
    }
  }
}

window.StudentDashboard = StudentDashboard;
