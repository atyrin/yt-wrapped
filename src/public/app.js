/**
 * YouTrack Wrapped - Serverless Frontend Application
 * All data retrieval and analysis is executed in the browser
 */

import { YouTrackClient } from './services/youtrackClient.js';
import { DataCollector } from './services/dataCollector.js';
import { StatisticsCalculator } from './services/statisticsCalculator.js';

class YouTrackWrapped {
  constructor() {
    this.data = null;
    this.config = null;
    console.log('[YouTrackWrapped] Initializing application...');
    this.init();
  }

  init() {
    console.log('[YouTrackWrapped] Setting up login form');
    this.setupLoginForm();
    this.loadSavedConfig();
  }

  /**
   * Load previously saved configuration from localStorage
   */
  loadSavedConfig() {
    try {
      const saved = localStorage.getItem('youtrack-wrapped-config');
      const rememberCheckbox = document.getElementById('remember-credentials');

      if (saved) {
        const config = JSON.parse(saved);
        document.getElementById('youtrack-url').value = config.baseUrl || '';
        document.getElementById('youtrack-token').value = config.token || '';
        document.getElementById('year').value = config.year || 2025;
        document.getElementById('article-projects').value = config.articleProjects || '';

        // If we have saved credentials, the user previously chose to remember them
        if (config.baseUrl && config.token) {
          rememberCheckbox.checked = true;
        }

        console.log('[YouTrackWrapped] Loaded saved configuration');
      }
    } catch (error) {
      console.warn('[YouTrackWrapped] Could not load saved config:', error);
    }
  }

  /**
   * Save configuration to localStorage (only if remember is checked)
   */
  saveConfig(config, remember) {
    try {
      if (remember) {
        localStorage.setItem('youtrack-wrapped-config', JSON.stringify(config));
        console.log('[YouTrackWrapped] Configuration saved to localStorage');
      } else {
        // Clear any previously saved credentials
        localStorage.removeItem('youtrack-wrapped-config');
        console.log('[YouTrackWrapped] Credentials not saved (remember unchecked)');
      }
    } catch (error) {
      console.warn('[YouTrackWrapped] Could not save config:', error);
    }
  }

  /**
   * Clear saved credentials from localStorage
   */
  clearSavedCredentials() {
    try {
      localStorage.removeItem('youtrack-wrapped-config');
      console.log('[YouTrackWrapped] Saved credentials cleared');
    } catch (error) {
      console.warn('[YouTrackWrapped] Could not clear saved credentials:', error);
    }
  }

  /**
   * Set up the login form event handlers
   */
  setupLoginForm() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });

    // Set default year to 2025
    const yearInput = document.getElementById('year');
    if (!yearInput.value) {
      yearInput.value = 2025;
    }
  }

  /**
   * Handle the login form submission
   */
  async handleLogin() {
    const baseUrl = document.getElementById('youtrack-url').value.trim();
    const token = document.getElementById('youtrack-token').value.trim();
    const year = parseInt(document.getElementById('year').value, 10);
    const articleProjectsInput = document.getElementById('article-projects').value.trim();
    const rememberCredentials = document.getElementById('remember-credentials').checked;
    const articleProjects = articleProjectsInput
      ? articleProjectsInput.split(',').map(p => p.trim()).filter(p => p)
      : [];

    if (!baseUrl || !token || !year) {
      this.showLoginError('Please fill in all required fields');
      return;
    }

    this.config = { baseUrl, token, year, articleProjects: articleProjectsInput };

    // Hide login, show loading
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('loading').style.display = 'flex';

    try {
      await this.loadData(baseUrl, token, year, articleProjects);
      this.saveConfig(this.config, rememberCredentials);
      this.hideLoading();
      this.showWrapped();
      this.renderAll();
      this.setupScrollAnimations();
      this.setupShareButton();
      console.log('[YouTrackWrapped] Init completed successfully');
    } catch (error) {
      console.error('[YouTrackWrapped] Init failed with error:', error);
      this.showError(error.message);
    }
  }

  /**
   * Show error on login form
   */
  showLoginError(message) {
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }

  /**
   * Update loading progress message
   */
  updateProgress(message) {
    const progressText = document.getElementById('loading-text');
    if (progressText) {
      progressText.textContent = message;
    }
  }

  /**
   * Load data directly from YouTrack API
   */
  async loadData(baseUrl, token, year, articleProjects) {
    console.log(`[YouTrackWrapped] Loading data for year ${year} from ${baseUrl}`);
    const startTime = performance.now();

    try {
      // Create the client and collector
      this.updateProgress('Connecting to YouTrack...');
      const client = new YouTrackClient(baseUrl, token);
      const collector = new DataCollector(client);

      // Collect all data
      const rawData = await collector.collectYearData(year, articleProjects, (progress) => {
        this.updateProgress(progress);
      });

      // Calculate statistics
      this.updateProgress('Calculating your statistics...');
      const calculator = new StatisticsCalculator(rawData);
      this.data = calculator.calculateAll();

      const duration = (performance.now() - startTime).toFixed(2);
      console.log(`[YouTrackWrapped] Data loaded and processed in ${duration}ms`);
      console.log('[YouTrackWrapped] Statistics:', this.data);
    } catch (error) {
      const duration = (performance.now() - startTime).toFixed(2);
      console.error(`[YouTrackWrapped] Failed after ${duration}ms:`, error);

      // Provide more helpful error messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error(
          'Could not connect to YouTrack. Please check:\n' +
          '1. The YouTrack URL is correct\n' +
          '2. Your YouTrack instance has CORS enabled for this origin\n' +
          '3. You have network connectivity'
        );
      }
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication failed. Please check your API token.\n' +
          'Make sure the token has the required permissions.'
        );
      }
      throw error;
    }
  }

  hideLoading() {
    document.getElementById('loading').style.display = 'none';
  }

  showWrapped() {
    document.getElementById('wrapped').style.display = 'block';
  }

  showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'flex';
    document.getElementById('error-message').textContent = message;
  }

  renderAll() {
    this.renderHero();
    this.renderSummary();
    this.renderTopProject();
    this.renderTimeStats();
    this.renderStreak();
    this.renderFunFacts();
    this.renderAchievements();
    this.renderFinal();
  }

  renderHero() {
    const { user, year } = this.data;

    document.getElementById('year-text').textContent = year;
    document.getElementById('user-name').textContent = user.fullName || user.login;

    const avatar = document.getElementById('user-avatar');
    if (user.avatarUrl) {
      // Build full avatar URL if it's a relative path
      let avatarUrl = user.avatarUrl;
      if (avatarUrl.startsWith('/')) {
        avatarUrl = this.config.baseUrl + avatarUrl;
      }
      avatar.src = avatarUrl;
      avatar.onerror = () => {
        // Fallback to initials if avatar fails to load
        this.renderInitialsAvatar(avatar, user);
      };
    } else {
      this.renderInitialsAvatar(avatar, user);
    }
  }

  renderInitialsAvatar(avatar, user) {
    const initials = (user.fullName || user.login)
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(0, 0, 120, 120);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 60, 60);
    avatar.src = canvas.toDataURL();
  }

  renderSummary() {
    const { summary } = this.data;

    this.animateNumber('stat-issues-created', summary.totalIssuesCreated);
    this.animateNumber('stat-issues-resolved', summary.totalIssuesResolved);
    this.animateNumber('stat-comments', summary.totalComments);
    this.animateNumber('stat-articles', summary.totalArticles);
    this.animateNumber('total-contributions', summary.totalContributions);
  }

  renderTopProject() {
    const { projectStats } = this.data;

    if (!projectStats.topProject) {
      document.getElementById('top-project').style.display = 'none';
      return;
    }

    const top = projectStats.topProject;
    document.getElementById('project-badge').textContent = top.shortName;
    document.getElementById('project-name').textContent = top.name;
    document.getElementById('project-issues').textContent = top.issuesCreated;
    document.getElementById('project-resolved').textContent = top.issuesResolved;
    document.getElementById('project-comments').textContent = top.comments;

    // Render all projects list
    const projectsList = document.getElementById('projects-list');
    projectsList.innerHTML = projectStats.projects
      .slice(0, 10)
      .map(p => `<div class="project-chip">${p.shortName}: ${p.totalActivity}</div>`)
      .join('');
  }

  renderTimeStats() {
    const { timeStats } = this.data;

    document.getElementById('busiest-month').textContent = timeStats.busiestMonth.monthName;
    document.getElementById('busiest-month-count').textContent = `${timeStats.busiestMonth.count} activities`;

    document.getElementById('busiest-day').textContent = timeStats.busiestDayOfWeek.dayName;
    document.getElementById('busiest-day-count').textContent = `${timeStats.busiestDayOfWeek.count} activities`;

    document.getElementById('busiest-hour').textContent = `${String(timeStats.busiestHour.hour).padStart(2, '0')}:00`;
    document.getElementById('busiest-hour-count').textContent = `${timeStats.busiestHour.count} activities`;

    // Render monthly chart
    const chartContainer = document.getElementById('monthly-chart');
    const maxActivity = Math.max(...Object.values(timeStats.monthlyActivity));

    chartContainer.innerHTML = Object.values(timeStats.monthlyActivity)
      .map((count, index) => {
        const height = maxActivity > 0 ? (count / maxActivity) * 100 : 0;
        return `<div class="chart-bar" style="height: ${Math.max(height, 3)}%" title="${count} activities"></div>`;
      })
      .join('');
  }

  renderStreak() {
    const { timeStats } = this.data;
    const streak = timeStats.longestStreak;

    document.getElementById('streak-days').textContent = streak.days;

    const datesContainer = document.getElementById('streak-dates');
    if (streak.days > 0 && streak.startDate) {
      datesContainer.innerHTML = `
        <span class="streak-start">${this.formatDate(streak.startDate)}</span>
        <span class="streak-arrow">→</span>
        <span class="streak-end">${this.formatDate(streak.endDate)}</span>
      `;
    } else {
      datesContainer.innerHTML = '<span>No streak recorded</span>';
    }
  }

  renderFunFacts() {
    const { funFacts } = this.data;
    const container = document.getElementById('facts-list');

    if (funFacts.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary);">Not enough data for fun facts yet!</p>';
      return;
    }

    container.innerHTML = funFacts
      .map(fact => `
        <div class="fact-card">
          <div class="fact-icon">${fact.icon}</div>
          <div class="fact-content">
            <div class="fact-text">${fact.text}</div>
            <div class="fact-comparison">${fact.comparison}</div>
          </div>
        </div>
      `)
      .join('');
  }

  renderAchievements() {
    const { achievements } = this.data;
    const container = document.getElementById('achievements-grid');

    if (achievements.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary);">Keep contributing to unlock achievements!</p>';
      return;
    }

    container.innerHTML = achievements
      .map(achievement => `
        <div class="achievement-card">
          <div class="achievement-icon">${achievement.icon}</div>
          <div class="achievement-name">${achievement.name}</div>
          <div class="achievement-description">${achievement.description}</div>
        </div>
      `)
      .join('');
  }

  renderFinal() {
    const { year } = this.data;
    document.getElementById('next-year').textContent = year + 1;
  }

  animateNumber(elementId, target, duration = 1500) {
    const element = document.getElementById(elementId);
    const start = 0;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + (target - start) * easeOutQuart);

      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target.toLocaleString();
      }
    };

    requestAnimationFrame(update);
  }

  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  setupScrollAnimations() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.slide-content').forEach(el => {
      observer.observe(el);
    });
  }

  setupShareButton() {
    const shareButton = document.getElementById('share-button');
    shareButton.addEventListener('click', async () => {
      const { user, year, summary } = this.data;

      const shareText = `My YouTrack ${year} Wrapped:
- ${summary.totalIssuesCreated} issues created
- ${summary.totalIssuesResolved} issues resolved
- ${summary.totalComments} comments left
- ${summary.totalArticles} articles written

${summary.totalContributions} total contributions!`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: `YouTrack ${year} Wrapped`,
            text: shareText,
          });
        } catch (err) {
          if (err.name !== 'AbortError') {
            this.copyToClipboard(shareText);
          }
        }
      } else {
        this.copyToClipboard(shareText);
      }
    });
  }

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      const button = document.getElementById('share-button');
      const originalText = button.textContent;
      button.textContent = 'Copied to clipboard!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new YouTrackWrapped();
});
