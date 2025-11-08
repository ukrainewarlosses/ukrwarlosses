# Hardcoded YouTube System

## Overview

The YouTube video system has been refactored to use hardcoded data instead of API calls during page rendering. This improves performance by eliminating client-side API requests and ensures video data consistency.

## Architecture

### Before
- YouTube videos were loaded dynamically during server-side rendering
- YouTube API was called on every page load
- API failures could cause slow page loads or empty video sections

### After
- YouTube videos are pre-fetched and embedded in the build
- Data is generated offline using the YouTube API
- No API calls are made by end users during page rendering

## Files

### Generated Data Files
- `src/data/hardcoded-youtube-data.json` - JSON format data
- `src/data/hardcoded-youtube-data.ts` - TypeScript module with exported data

### Scripts
- `scripts/generate-hardcoded-youtube-data.ts` - TypeScript script to fetch and generate hardcoded video data
- `scripts/update-hardcoded-chart-data.js` - Updated Node.js wrapper script that handles both chart and YouTube data

### Modified Components
- `src/app/page.tsx` - Now imports and uses hardcoded YouTube data
- `src/lib/dataLoader.ts` - YouTube loading removed from server-side data loading

## Data Structure

The hardcoded YouTube data contains:

```typescript
interface HardcodedYouTubeData {
  videos: YouTubeEmbed[];
  lastUpdated: string;
}

interface YouTubeEmbed {
  title: string;
  youtube_id: string;
  channel_name: string;
}
```

## Update Process

When the daily cron job runs, it should call the update script to regenerate both chart and YouTube data:

```bash
node scripts/update-hardcoded-chart-data.js
```

This script:
1. Updates hardcoded chart data from latest scraped data
2. Fetches latest videos from YouTube API using `YOUTUBE_API_KEY`
3. Generates both JSON and TypeScript versions
4. Cleans up temporary files

## Environment Variables

The YouTube data generation requires:

```bash
YOUTUBE_API_KEY=your_youtube_api_key_here
```

This should be set in the `.env` file at the project root.

## API Integration

The YouTube service (`src/lib/youtube.ts`) fetches videos from the "History Legends" channel:
- Uses YouTube Data API v3
- Fetches latest 3 videos by default
- Falls back to hardcoded videos if API fails
- Handles channel search by name and playlist fetching

## Benefits

1. **Performance**: No YouTube API calls during page rendering
2. **Reliability**: Videos are always available, no API dependency for users
3. **Consistency**: Video data is stable across page loads
4. **Cost Efficiency**: YouTube API quota is only used during data generation, not on every page view
5. **Caching**: Static video data can be cached more effectively

## Integration with Cron Jobs

Add this line to your daily cron job after data scraping:

```bash
node /path/to/project/scripts/update-hardcoded-chart-data.js
```

This single script now updates both chart data and YouTube videos.

## Development

To manually update the hardcoded YouTube data during development:

```bash
# Generate new YouTube data only
npx tsc scripts/generate-hardcoded-youtube-data.ts --outDir . --target es2022 --module commonjs --moduleResolution node --esModuleInterop
node generate-hardcoded-youtube-data.js
rm generate-hardcoded-youtube-data.js

# Or update both chart and YouTube data
node scripts/update-hardcoded-chart-data.js
```

## Fallback Behavior

If the YouTube API fails during data generation:
- The script falls back to predefined video data
- The system continues to work with the fallback videos
- No errors are thrown that would break the build process

## Monitoring

The generation script logs information about the fetched videos:

```javascript
console.log(`📊 Generated YouTube data:`, {
  videoCount: youtubeVideos.length,
  videos: youtubeVideos.map(v => ({ title: v.title, id: v.youtube_id }))
});
```

Check the cron job logs to verify videos are being fetched correctly and see when they were last updated.
