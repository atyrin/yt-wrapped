/**
 * Data Collector Service (Browser Version)
 * Collects and aggregates data from YouTrack for the Wrapped statistics
 */

export class DataCollector {
  constructor(youtrackClient) {
    this.client = youtrackClient;
    console.log('[DataCollector] Initialized with YouTrack client');
  }

  /**
   * Collect all data for a specific year
   * @param {number} year - The year to collect data for
   * @param {string[]} articleProjects - Project short names to fetch articles from
   * @param {function} onProgress - Optional progress callback
   */
  async collectYearData(year, articleProjects = [], onProgress) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    const collectionId = Math.random().toString(36).substring(7);

    console.log(`[DataCollector][${collectionId}] Starting data collection for year ${year}`);
    console.log(`[DataCollector][${collectionId}] Date range: ${startDate} to ${endDate}`);

    const updateProgress = (message) => {
      if (onProgress) onProgress(message);
    };

    // Get current user
    updateProgress('Fetching your user information...');
    let currentUser;
    try {
      currentUser = await this.client.getCurrentUser();
      console.log(`[DataCollector][${collectionId}] Current user: ${currentUser.fullName} (${currentUser.login})`);
    } catch (error) {
      console.error(`[DataCollector][${collectionId}] Failed to fetch current user:`, error.message);
      throw error;
    }

    // Collect all data in parallel
    updateProgress('Fetching your issues, comments, and articles...');
    const parallelStart = Date.now();

    let createdIssues, resolvedIssues, issuesWithComments, allArticles;
    try {
      [createdIssues, resolvedIssues, issuesWithComments, allArticles] = await Promise.all([
        this.client.getIssuesCreatedByUser(currentUser.login, startDate, endDate, updateProgress)
          .then(result => {
            console.log(`[DataCollector][${collectionId}] Created issues: ${result.length} items`);
            return result;
          }),
        this.client.getIssuesResolvedByUser(currentUser.login, startDate, endDate, updateProgress)
          .then(result => {
            console.log(`[DataCollector][${collectionId}] Resolved issues: ${result.length} items`);
            return result;
          }),
        this.client.getIssuesWithComments(currentUser.login, startDate, endDate, updateProgress)
          .then(result => {
            console.log(`[DataCollector][${collectionId}] Issues with comments: ${result.length} items`);
            return result;
          }),
        this.client.getArticles(articleProjects, updateProgress)
          .then(result => {
            console.log(`[DataCollector][${collectionId}] Articles: ${result.length} items`);
            return result;
          })
      ]);
    } catch (error) {
      console.error(`[DataCollector][${collectionId}] Parallel fetch failed:`, error.message);
      throw error;
    }

    const parallelDuration = Date.now() - parallelStart;
    console.log(`[DataCollector][${collectionId}] Parallel fetch completed in ${parallelDuration}ms`);

    // Extract user's comments from all issues
    updateProgress('Processing your comments...');
    const userComments = this.extractUserComments(issuesWithComments, currentUser.login, year);
    console.log(`[DataCollector][${collectionId}] Found ${userComments.length} comments by user`);

    // Filter articles by user and year
    updateProgress('Processing your articles...');
    const userArticles = this.filterArticlesByUserAndYear(allArticles, currentUser.login, year);
    console.log(`[DataCollector][${collectionId}] Found ${userArticles.length} articles by user`);

    console.log(`[DataCollector][${collectionId}] Data collection complete`);

    return {
      user: currentUser,
      year,
      createdIssues,
      resolvedIssues,
      comments: userComments,
      articles: userArticles,
      collectedAt: new Date().toISOString()
    };
  }

  /**
   * Extract comments made by the user within the year
   */
  extractUserComments(issues, userLogin, year) {
    const comments = [];
    const yearStart = new Date(`${year}-01-01T00:00:00Z`).getTime();
    const yearEnd = new Date(`${year}-12-31T23:59:59Z`).getTime();

    for (const issue of issues) {
      if (!issue.comments) continue;

      for (const comment of issue.comments) {
        if (
          comment.author &&
          comment.author.login === userLogin &&
          comment.created >= yearStart &&
          comment.created <= yearEnd
        ) {
          comments.push({
            ...comment,
            issue: {
              id: issue.id,
              idReadable: issue.idReadable,
              summary: issue.summary,
              project: issue.project
            }
          });
        }
      }
    }

    return comments;
  }

  /**
   * Filter articles by user and year
   */
  filterArticlesByUserAndYear(articles, userLogin, year) {
    const yearStart = new Date(`${year}-01-01T00:00:00Z`).getTime();
    const yearEnd = new Date(`${year}-12-31T23:59:59Z`).getTime();

    return articles.filter(article =>
      article.reporter &&
      article.reporter.login === userLogin &&
      article.created >= yearStart &&
      article.created <= yearEnd
    );
  }
}

export default DataCollector;
