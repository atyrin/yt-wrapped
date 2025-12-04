/**
 * YouTrack API Client (Browser Version)
 * Handles all communication with the YouTrack REST API from the browser
 *
 * Note: YouTrack must have CORS configured to allow requests from this origin,
 * or the user must access this from a domain that YouTrack trusts.
 */

export class YouTrackClient {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;
    this.apiBase = `${this.baseUrl}/api`;
    console.log(`[YouTrackClient] Initialized with base URL: ${this.baseUrl}`);
  }

  /**
   * Make an authenticated request to the YouTrack API
   */
  async request(endpoint, options = {}) {
    const url = `${this.apiBase}${endpoint}`;
    const method = options.method || 'GET';
    const requestId = Math.random().toString(36).substring(7);

    console.log(`[YouTrackClient][${requestId}] ${method} ${url}`);
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const duration = Date.now() - startTime;
      console.log(`[YouTrackClient][${requestId}] Response: ${response.status} ${response.statusText} (${duration}ms)`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[YouTrackClient][${requestId}] Error response body:`, errorText);
        throw new Error(`YouTrack API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log(`[YouTrackClient][${requestId}] Success - received ${Array.isArray(data) ? data.length + ' items' : 'object'}`);
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[YouTrackClient][${requestId}] Request failed after ${duration}ms`);
      console.error(`[YouTrackClient][${requestId}] Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser() {
    return this.request('/users/me?fields=id,login,fullName,email,avatarUrl');
  }

  /**
   * Get issues created by a user within a date range
   * @param {string} userId - The user's login or ID
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @param {function} onProgress - Optional progress callback
   */
  async getIssuesCreatedByUser(userId, startDate, endDate, onProgress) {
    const query = encodeURIComponent(`created: ${startDate} .. ${endDate} created by: ${userId}`);
    const fields = 'id,idReadable,summary,created,resolved,project(id,name,shortName),customFields(name,value(name))';

    let allIssues = [];
    let skip = 0;
    const top = 100;

    while (true) {
      const issues = await this.request(
        `/issues?query=${query}&fields=${fields}&$top=${top}&$skip=${skip}`
      );

      if (issues.length === 0) break;

      allIssues = allIssues.concat(issues);
      skip += top;

      if (onProgress) {
        onProgress(`Fetched ${allIssues.length} created issues...`);
      }

      if (issues.length < top) break;
    }

    return allIssues;
  }

  /**
   * Get all issues to search for comments by the user
   * @param {string} userId - The user's login
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @param {function} onProgress - Optional progress callback
   */
  async getIssuesWithComments(userId, startDate, endDate, onProgress) {
    const query = encodeURIComponent(`commenter: ${userId} commented: ${startDate} .. ${endDate}`);
    const fields = 'id,idReadable,summary,project(id,name,shortName),comments(id,text,created,author(id,login,fullName))';

    let allIssues = [];
    let skip = 0;
    const top = 100;

    while (true) {
      const issues = await this.request(
        `/issues?query=${query}&fields=${fields}&$top=${top}&$skip=${skip}`
      );

      if (issues.length === 0) break;

      allIssues = allIssues.concat(issues);
      skip += top;

      if (onProgress) {
        onProgress(`Fetched ${allIssues.length} issues with comments...`);
      }

      if (issues.length < top) break;
    }

    return allIssues;
  }

  /**
   * Get issues resolved by a user within a date range
   * @param {string} userId - The user's login
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @param {function} onProgress - Optional progress callback
   */
  async getIssuesResolvedByUser(userId, startDate, endDate, onProgress) {
    const query = encodeURIComponent(`resolved date: ${startDate} .. ${endDate} Assignee: ${userId}`);
    const fields = 'id,idReadable,summary,created,resolved,project(id,name,shortName),customFields(name,value(name))';

    let allIssues = [];
    let skip = 0;
    const top = 100;

    while (true) {
      const issues = await this.request(
        `/issues?query=${query}&fields=${fields}&$top=${top}&$skip=${skip}`
      );

      if (issues.length === 0) break;

      allIssues = allIssues.concat(issues);
      skip += top;

      if (onProgress) {
        onProgress(`Fetched ${allIssues.length} resolved issues...`);
      }

      if (issues.length < top) break;
    }

    return allIssues;
  }

  /**
   * Get articles from specific projects
   * @param {string[]} projectShortNames - Array of project short names
   * @param {function} onProgress - Optional progress callback
   */
  async getArticles(projectShortNames = [], onProgress) {
    if (projectShortNames.length === 0) {
      return [];
    }

    const fields = 'id,idReadable,summary,content,created,updated,reporter(id,login,fullName),project(id,name,shortName)';
    const top = 100;

    // Fetch articles from each project
    const allArticles = [];

    for (const shortName of projectShortNames) {
      let projectArticles = [];
      let skip = 0;

      try {
        while (true) {
          const articles = await this.request(
            `/admin/projects/${shortName}/articles?fields=${fields}&$top=${top}&$skip=${skip}`
          );

          if (articles.length === 0) break;

          projectArticles = projectArticles.concat(articles);
          skip += top;

          if (articles.length < top) break;
        }

        allArticles.push(...projectArticles);

        if (onProgress) {
          onProgress(`Fetched ${allArticles.length} articles...`);
        }
      } catch (error) {
        // Skip projects where articles can't be fetched (might not have permission)
        console.warn(`[YouTrackClient] Could not fetch articles from project ${shortName}:`, error.message);
      }
    }

    return allArticles;
  }

  /**
   * Get all projects the user has access to
   */
  async getProjects() {
    const fields = 'id,name,shortName,description';
    return this.request(`/admin/projects?fields=${fields}&$top=100`);
  }
}

export default YouTrackClient;
