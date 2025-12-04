# YouTrack Wrapped

A Spotify Wrapped-style "Year in Review" page for YouTrack. View your yearly achievements including issues created, comments left, articles written, and more!

## Serverless Architecture

This application runs entirely in your browser. All data retrieval and analysis happens client-side - no backend server is needed. Your credentials are never sent to any third-party server.

## Features

- **Summary Statistics**: Total issues created, resolved, comments, and articles
- **Project Breakdown**: See which projects you contributed to most
- **Time Analysis**: Discover your busiest month, day of the week, and peak hours
- **Activity Streaks**: Track your longest consecutive activity streak
- **Fun Facts**: Personalized insights about your work patterns
- **Achievements**: Unlock badges based on your contributions
- **Shareable**: Share your wrapped summary with colleagues
- **Privacy-First**: All data processing happens in your browser

## Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A YouTrack instance with API access
- A YouTrack permanent token
- YouTrack instance must have CORS enabled for your origin (or use the same domain)

## Quick Start

### Option 1: Open directly
Simply open `src/public/index.html` in your browser. No server required!

### Option 2: Use a static file server

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the server**
   ```bash
   npm start
   ```

3. **Open** `http://localhost:3000` in your browser

## Getting a YouTrack Token

1. Go to your YouTrack instance
2. Navigate to **Profile** → **Account Security** → **Tokens** (or Hub → Authentications → Tokens)
3. Click **New Token**
4. Give it a name and select appropriate scopes (read access is sufficient)
5. Copy the token - you'll enter it in the app

## Usage

1. Open the application in your browser
2. Enter your YouTrack URL (e.g., `https://youtrack.example.com`)
3. Paste your API token
4. Select the year to analyze
5. Optionally, enter project short names for article statistics (comma-separated)
6. Click "Generate My Wrapped"

Your configuration is saved in browser localStorage for convenience (you can clear it anytime).

## CORS Configuration

Since this app makes direct API calls from the browser to your YouTrack instance, you need to ensure CORS is configured properly:

### For YouTrack InCloud
CORS should work automatically if you access the app from a trusted origin.

### For Self-Hosted YouTrack
You may need to configure CORS headers on your YouTrack server or use a reverse proxy.

### Alternative: Host on Same Domain
If you host this app on the same domain as your YouTrack instance, CORS won't be an issue.

## Data Collected

The app fetches the following data from your YouTrack instance:

- **Issues**: Created and resolved issues by the current user
- **Comments**: Comments left by the current user on any issues
- **Articles**: Knowledge base articles created by the current user (from specified projects)

All data is fetched using your credentials and filtered to the specified year.

## Statistics Calculated

- Total contributions (issues + comments + articles)
- Issues by project
- Monthly, daily, and hourly activity distribution
- Longest activity streak
- Various achievements based on contribution levels

## Customization

### Changing Colors

Edit the CSS variables in `src/public/styles.css`:

```css
:root {
  --primary: #6366f1;
  --secondary: #ec4899;
  --accent: #14b8a6;
  /* ... */
}
```

### Adding New Achievements

Edit `src/public/services/statisticsCalculator.js` and add new achievement logic in the `calculateAchievements()` method.

## Deployment

Since this is a fully static application, you can deploy it anywhere:

- **GitHub Pages**: Push to a `gh-pages` branch
- **Netlify/Vercel**: Connect your repo for automatic deploys
- **Any static hosting**: Just upload the `src/public` folder
- **Local**: Open `index.html` directly in your browser

## Privacy & Security

- Your YouTrack credentials never leave your browser
- No data is sent to any third-party servers
- All API calls go directly from your browser to your YouTrack instance
- Configuration is stored only in your browser's localStorage

## License

MIT
