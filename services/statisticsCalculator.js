/**
 * Statistics Calculator (Browser Version)
 * Calculates fun and viral statistics from the collected YouTrack data
 */

export class StatisticsCalculator {
  constructor(data) {
    this.data = data;
  }

  /**
   * Calculate all statistics for the Wrapped page
   */
  calculateAll() {
    return {
      user: this.data.user,
      year: this.data.year,
      summary: this.calculateSummary(),
      issueStats: this.calculateIssueStats(),
      commentStats: this.calculateCommentStats(),
      articleStats: this.calculateArticleStats(),
      projectStats: this.calculateProjectStats(),
      timeStats: this.calculateTimeStats(),
      funFacts: this.calculateFunFacts(),
      achievements: this.calculateAchievements()
    };
  }

  /**
   * High-level summary numbers
   */
  calculateSummary() {
    return {
      totalIssuesCreated: this.data.createdIssues.length,
      totalIssuesResolved: this.data.resolvedIssues.length,
      totalComments: this.data.comments.length,
      totalArticles: this.data.articles.length,
      totalContributions:
        this.data.createdIssues.length +
        this.data.resolvedIssues.length +
        this.data.comments.length +
        this.data.articles.length
    };
  }

  /**
   * Detailed issue statistics
   */
  calculateIssueStats() {
    const issues = this.data.createdIssues;

    // Average resolution time for resolved issues that were created this year
    const resolvedCreatedIssues = issues.filter(i => i.resolved);
    const avgResolutionTime = resolvedCreatedIssues.length > 0
      ? resolvedCreatedIssues.reduce((sum, i) => sum + (i.resolved - i.created), 0) / resolvedCreatedIssues.length
      : 0;

    // Find the longest and shortest issue summaries
    const sortedBySummaryLength = [...issues].sort((a, b) =>
      (b.summary?.length || 0) - (a.summary?.length || 0)
    );

    return {
      total: issues.length,
      resolved: this.data.resolvedIssues.length,
      avgResolutionTimeMs: avgResolutionTime,
      avgResolutionTimeDays: Math.round(avgResolutionTime / (1000 * 60 * 60 * 24)),
      longestSummary: sortedBySummaryLength[0] || null,
      shortestSummary: sortedBySummaryLength[sortedBySummaryLength.length - 1] || null
    };
  }

  /**
   * Comment statistics
   */
  calculateCommentStats() {
    const comments = this.data.comments;

    if (comments.length === 0) {
      return {
        total: 0,
        avgLength: 0,
        longestComment: null,
        shortestComment: null,
        totalCharacters: 0,
        mostCommentedIssue: null
      };
    }

    // Calculate comment lengths
    const commentLengths = comments.map(c => ({
      comment: c,
      length: c.text?.length || 0
    }));

    const totalChars = commentLengths.reduce((sum, c) => sum + c.length, 0);

    // Sort by length
    commentLengths.sort((a, b) => b.length - a.length);

    // Find most commented issue
    const issueCommentCounts = {};
    for (const comment of comments) {
      const issueId = comment.issue.idReadable;
      if (!issueCommentCounts[issueId]) {
        issueCommentCounts[issueId] = {
          issue: comment.issue,
          count: 0
        };
      }
      issueCommentCounts[issueId].count++;
    }

    const mostCommentedIssue = Object.values(issueCommentCounts)
      .sort((a, b) => b.count - a.count)[0] || null;

    return {
      total: comments.length,
      avgLength: Math.round(totalChars / comments.length),
      totalCharacters: totalChars,
      longestComment: commentLengths[0]?.comment || null,
      shortestComment: commentLengths[commentLengths.length - 1]?.comment || null,
      mostCommentedIssue
    };
  }

  /**
   * Article statistics
   */
  calculateArticleStats() {
    const articles = this.data.articles;

    if (articles.length === 0) {
      return {
        total: 0,
        totalContentLength: 0,
        avgContentLength: 0,
        longestArticle: null
      };
    }

    const contentLengths = articles.map(a => ({
      article: a,
      length: a.content?.length || 0
    }));

    const totalLength = contentLengths.reduce((sum, a) => sum + a.length, 0);
    contentLengths.sort((a, b) => b.length - a.length);

    return {
      total: articles.length,
      totalContentLength: totalLength,
      avgContentLength: Math.round(totalLength / articles.length),
      longestArticle: contentLengths[0]?.article || null
    };
  }

  /**
   * Project-based statistics
   */
  calculateProjectStats() {
    const projectCounts = {};

    // Count issues by project
    for (const issue of this.data.createdIssues) {
      const projectName = issue.project?.name || 'Unknown';
      if (!projectCounts[projectName]) {
        projectCounts[projectName] = {
          name: projectName,
          shortName: issue.project?.shortName || '?',
          issuesCreated: 0,
          issuesResolved: 0,
          comments: 0
        };
      }
      projectCounts[projectName].issuesCreated++;
    }

    // Count resolved issues by project
    for (const issue of this.data.resolvedIssues) {
      const projectName = issue.project?.name || 'Unknown';
      if (!projectCounts[projectName]) {
        projectCounts[projectName] = {
          name: projectName,
          shortName: issue.project?.shortName || '?',
          issuesCreated: 0,
          issuesResolved: 0,
          comments: 0
        };
      }
      projectCounts[projectName].issuesResolved++;
    }

    // Count comments by project
    for (const comment of this.data.comments) {
      const projectName = comment.issue?.project?.name || 'Unknown';
      if (!projectCounts[projectName]) {
        projectCounts[projectName] = {
          name: projectName,
          shortName: comment.issue?.project?.shortName || '?',
          issuesCreated: 0,
          issuesResolved: 0,
          comments: 0
        };
      }
      projectCounts[projectName].comments++;
    }

    // Sort by total activity
    const projects = Object.values(projectCounts)
      .map(p => ({
        ...p,
        totalActivity: p.issuesCreated + p.issuesResolved + p.comments
      }))
      .sort((a, b) => b.totalActivity - a.totalActivity);

    return {
      totalProjects: projects.length,
      projects,
      topProject: projects[0] || null
    };
  }

  /**
   * Time-based statistics
   */
  calculateTimeStats() {
    const allActivities = [
      ...this.data.createdIssues.map(i => ({ type: 'issue', timestamp: i.created })),
      ...this.data.comments.map(c => ({ type: 'comment', timestamp: c.created })),
      ...this.data.articles.map(a => ({ type: 'article', timestamp: a.created }))
    ];

    // Activity by month
    const monthlyActivity = {};
    const dayOfWeekActivity = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const hourlyActivity = {};

    for (let i = 0; i < 24; i++) {
      hourlyActivity[i] = 0;
    }

    for (let i = 1; i <= 12; i++) {
      monthlyActivity[i] = 0;
    }

    for (const activity of allActivities) {
      const date = new Date(activity.timestamp);
      const month = date.getMonth() + 1;
      const dayOfWeek = date.getDay();
      const hour = date.getHours();

      monthlyActivity[month]++;
      dayOfWeekActivity[dayOfWeek]++;
      hourlyActivity[hour]++;
    }

    // Find busiest periods
    const busiestMonth = Object.entries(monthlyActivity)
      .sort((a, b) => b[1] - a[1])[0];

    const busiestDayOfWeek = Object.entries(dayOfWeekActivity)
      .sort((a, b) => b[1] - a[1])[0];

    const busiestHour = Object.entries(hourlyActivity)
      .sort((a, b) => b[1] - a[1])[0];

    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Calculate streaks
    const streak = this.calculateLongestStreak(allActivities);

    return {
      monthlyActivity,
      dayOfWeekActivity,
      hourlyActivity,
      busiestMonth: {
        month: parseInt(busiestMonth[0]),
        monthName: monthNames[parseInt(busiestMonth[0])],
        count: busiestMonth[1]
      },
      busiestDayOfWeek: {
        day: parseInt(busiestDayOfWeek[0]),
        dayName: dayNames[parseInt(busiestDayOfWeek[0])],
        count: busiestDayOfWeek[1]
      },
      busiestHour: {
        hour: parseInt(busiestHour[0]),
        count: busiestHour[1]
      },
      longestStreak: streak
    };
  }

  /**
   * Calculate the longest streak of consecutive days with activity
   */
  calculateLongestStreak(activities) {
    if (activities.length === 0) return { days: 0, startDate: null, endDate: null };

    // Get unique active days
    const activeDays = new Set(
      activities.map(a => {
        const date = new Date(a.timestamp);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      })
    );

    const sortedDays = [...activeDays].sort();

    let longestStreak = 1;
    let currentStreak = 1;
    let longestStart = sortedDays[0];
    let longestEnd = sortedDays[0];
    let currentStart = sortedDays[0];

    for (let i = 1; i < sortedDays.length; i++) {
      const prevDate = new Date(sortedDays[i - 1]);
      const currDate = new Date(sortedDays[i]);
      const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        currentStreak++;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
          longestStart = currentStart;
          longestEnd = sortedDays[i];
        }
      } else {
        currentStreak = 1;
        currentStart = sortedDays[i];
      }
    }

    return {
      days: longestStreak,
      startDate: longestStart,
      endDate: longestEnd
    };
  }

  /**
   * Generate fun facts and comparisons
   */
  calculateFunFacts() {
    const facts = [];
    const summary = this.calculateSummary();
    const commentStats = this.calculateCommentStats();
    const timeStats = this.calculateTimeStats();

    // Characters written in comments
    if (commentStats.totalCharacters > 0) {
      const pages = Math.round(commentStats.totalCharacters / 3000); // ~3000 chars per page
      if (pages > 0) {
        facts.push({
          icon: '📝',
          text: `You wrote ${commentStats.totalCharacters.toLocaleString()} characters in comments`,
          comparison: `That's about ${pages} page${pages > 1 ? 's' : ''} of text!`
        });
      }
    }

    // Busiest day comparison
    if (timeStats.busiestDayOfWeek) {
      facts.push({
        icon: '📅',
        text: `${timeStats.busiestDayOfWeek.dayName} was your power day`,
        comparison: `${timeStats.busiestDayOfWeek.count} activities on ${timeStats.busiestDayOfWeek.dayName}s`
      });
    }

    // Early bird or night owl
    if (timeStats.busiestHour) {
      const hour = timeStats.busiestHour.hour;
      let personality = '';
      if (hour >= 5 && hour < 9) personality = 'Early Bird';
      else if (hour >= 9 && hour < 12) personality = 'Morning Person';
      else if (hour >= 12 && hour < 17) personality = 'Afternoon Warrior';
      else if (hour >= 17 && hour < 21) personality = 'Evening Coder';
      else personality = 'Night Owl';

      facts.push({
        icon: '⏰',
        text: `You're a ${personality}`,
        comparison: `Most active around ${hour}:00`
      });
    }

    // Streak achievement
    if (timeStats.longestStreak && timeStats.longestStreak.days > 1) {
      facts.push({
        icon: '🔥',
        text: `${timeStats.longestStreak.days}-day activity streak!`,
        comparison: `From ${timeStats.longestStreak.startDate} to ${timeStats.longestStreak.endDate}`
      });
    }

    // Issues per month
    const monthlyIssues = summary.totalIssuesCreated / 12;
    if (monthlyIssues >= 1) {
      facts.push({
        icon: '📊',
        text: `You created ~${Math.round(monthlyIssues)} issues per month`,
        comparison: `That's one every ${Math.round(30 / monthlyIssues)} days on average`
      });
    }

    return facts;
  }

  /**
   * Calculate achievements/badges
   */
  calculateAchievements() {
    const achievements = [];
    const summary = this.calculateSummary();
    const timeStats = this.calculateTimeStats();
    const projectStats = this.calculateProjectStats();

    // Issue Creator achievements
    if (summary.totalIssuesCreated >= 100) {
      achievements.push({ id: 'issue_master', name: 'Issue Master', description: 'Created 100+ issues', icon: '🏆' });
    } else if (summary.totalIssuesCreated >= 50) {
      achievements.push({ id: 'issue_expert', name: 'Issue Expert', description: 'Created 50+ issues', icon: '🥇' });
    } else if (summary.totalIssuesCreated >= 20) {
      achievements.push({ id: 'issue_enthusiast', name: 'Issue Enthusiast', description: 'Created 20+ issues', icon: '🥈' });
    } else if (summary.totalIssuesCreated >= 5) {
      achievements.push({ id: 'issue_starter', name: 'Issue Starter', description: 'Created 5+ issues', icon: '🥉' });
    }

    // Bug Crusher
    if (summary.totalIssuesResolved >= 100) {
      achievements.push({ id: 'bug_crusher', name: 'Bug Crusher', description: 'Resolved 100+ issues', icon: '🐛' });
    } else if (summary.totalIssuesResolved >= 50) {
      achievements.push({ id: 'bug_hunter', name: 'Bug Hunter', description: 'Resolved 50+ issues', icon: '🔍' });
    } else if (summary.totalIssuesResolved >= 20) {
      achievements.push({ id: 'bug_squasher', name: 'Bug Squasher', description: 'Resolved 20+ issues', icon: '👊' });
    }

    // Commenter achievements
    if (summary.totalComments >= 500) {
      achievements.push({ id: 'chatterbox', name: 'Chatterbox', description: 'Left 500+ comments', icon: '💬' });
    } else if (summary.totalComments >= 200) {
      achievements.push({ id: 'conversationalist', name: 'Conversationalist', description: 'Left 200+ comments', icon: '🗣️' });
    } else if (summary.totalComments >= 50) {
      achievements.push({ id: 'contributor', name: 'Contributor', description: 'Left 50+ comments', icon: '✍️' });
    }

    // Documentation achievements
    if (summary.totalArticles >= 20) {
      achievements.push({ id: 'documentation_hero', name: 'Documentation Hero', description: 'Created 20+ articles', icon: '📚' });
    } else if (summary.totalArticles >= 10) {
      achievements.push({ id: 'knowledge_sharer', name: 'Knowledge Sharer', description: 'Created 10+ articles', icon: '📖' });
    } else if (summary.totalArticles >= 3) {
      achievements.push({ id: 'writer', name: 'Writer', description: 'Created 3+ articles', icon: '✏️' });
    }

    // Streak achievements
    if (timeStats.longestStreak.days >= 30) {
      achievements.push({ id: 'unstoppable', name: 'Unstoppable', description: '30+ day streak', icon: '🔥' });
    } else if (timeStats.longestStreak.days >= 14) {
      achievements.push({ id: 'consistent', name: 'Consistent', description: '14+ day streak', icon: '⚡' });
    } else if (timeStats.longestStreak.days >= 7) {
      achievements.push({ id: 'dedicated', name: 'Dedicated', description: '7+ day streak', icon: '💪' });
    }

    // Multi-project achievements
    if (projectStats.totalProjects >= 10) {
      achievements.push({ id: 'polyglot', name: 'Polyglot', description: 'Active in 10+ projects', icon: '🌍' });
    } else if (projectStats.totalProjects >= 5) {
      achievements.push({ id: 'versatile', name: 'Versatile', description: 'Active in 5+ projects', icon: '🎯' });
    }

    // Weekend warrior
    const weekendActivity = timeStats.dayOfWeekActivity[0] + timeStats.dayOfWeekActivity[6];
    if (weekendActivity > 20) {
      achievements.push({ id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Active on weekends', icon: '🦸' });
    }

    // Night owl
    const nightActivity = [22, 23, 0, 1, 2, 3, 4].reduce((sum, h) => sum + (timeStats.hourlyActivity[h] || 0), 0);
    if (nightActivity > 20) {
      achievements.push({ id: 'night_owl', name: 'Night Owl', description: 'Active late at night', icon: '🦉' });
    }

    // Early bird
    const morningActivity = [5, 6, 7, 8].reduce((sum, h) => sum + (timeStats.hourlyActivity[h] || 0), 0);
    if (morningActivity > 20) {
      achievements.push({ id: 'early_bird', name: 'Early Bird', description: 'Active early morning', icon: '🐦' });
    }

    return achievements;
  }
}

export default StatisticsCalculator;
