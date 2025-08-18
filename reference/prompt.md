Here's a comprehensive prompt for Cursor to create your NextJS war losses tracker project:

```
Create a NextJS 14 war losses tracking website with the following specifications:

## Project Overview
Build a professional war losses tracker for Ukraine-Russia conflict with real-time data scraping, dark theme UI, and Google AdSense integration. The site should track personnel casualties only (no equipment).

## Tech Stack
- NextJS 14 with App Router
- TypeScript
- Tailwind CSS for styling
- Supabase for PostgreSQL database
- Puppeteer for web scraping
- YouTube Data API v3 for video integration
- Google AdSense for monetization

## Design Requirements
- Dark theme with #1b1b1b background
- Clean, minimalist design inspired by Zona Media
- Professional typography using Inter font
- Responsive design (mobile-first)
- Brown/gold accent colors (#d4a574, #a0824a)
- Cards with #2a2a2a background and #3d3d3d borders

## Key Features Required

### 1. Homepage Layout
- Header with navigation (Overview, Trends, Coverage, Sources)
- Hero section with title "Ukraine-Russia War Personnel Losses Tracker"
- Real-time update timestamp with pulse animation
- Disclaimer about data methodology
- Stats grid showing:
  - Russian Forces personnel losses
  - Ukrainian Forces personnel losses
  - Both with country flags and animated counters
- Chart section placeholder for trend visualization
- Video section for latest YouTube coverage
- Sources section with links to Zona Media and UA Losses
- Footer with methodology links

### 2. Data Sources to Scrape
- Russian losses: https://en.zona.media/article/2025/08/01/casualties_eng-trl
- Ukrainian losses: https://ualosses.org/en/soldiers/
- Update every 6 hours via cron jobs

### 3. Database Schema
```sql
CREATE TABLE casualties (
  id SERIAL PRIMARY KEY,
  country VARCHAR(10) NOT NULL, -- 'russia' or 'ukraine'
  personnel_losses INTEGER NOT NULL,
  date_recorded TIMESTAMP DEFAULT NOW(),
  source_url VARCHAR(500)
);

CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  youtube_id VARCHAR(50) NOT NULL,
  channel_name VARCHAR(200),
  published_at TIMESTAMP,
  view_count INTEGER,
  thumbnail_url VARCHAR(500)
);
```

### 4. API Routes Needed
- `/api/scrape` - Scrape casualty data from sources
- `/api/casualties` - Get latest casualty numbers
- `/api/casualties/history` - Get historical data for charts
- `/api/videos` - Fetch latest YouTube videos about Ukraine war

### 5. Google AdSense Integration
Place ads in these locations:
- Header banner (728x90) - desktop only
- In-content rectangle (336x280) - between stats and chart
- Mobile sidebar (300x250) - mobile only between sections
- Footer banner (728x90) - above footer

### 6. Components to Create
- `StatsCard` - Animated counter for casualties
- `AdBanner` - Reusable Google AdSense component
- `VideoCard` - YouTube video display
- `SourceCard` - Data source links
- `Chart` - Casualty trends visualization (using Recharts)
- `UpdateIndicator` - Real-time update timestamp

### 7. Styling Details
Use these exact colors:
- Background: #1b1b1b
- Card backgrounds: #2a2a2a
- Borders: #3d3d3d
- Primary text: #f5f5f5
- Secondary text: #e2e8f0, #cbd5e0, #a0aec0
- Accent colors: #d4a574 (logo, links), #a0824a (nav)
- Casualty numbers: #ff6b6b
- Update indicator border: #d4a574

### 8. SEO Optimization
- Proper meta tags for war losses tracking
- Structured data for news articles
- Sitemap generation
- Open Graph tags for social sharing
- Fast loading with image optimization

### 9. Scraping Logic
Create robust scrapers that:
- Handle rate limiting and errors gracefully
- Parse casualty numbers from both sources
- Store historical data for trend analysis
- Validate data before saving to database
- Log scraping activities and errors

### 10. YouTube Integration
- Search for recent videos with keywords: "Ukraine war casualties", "Russian losses", "Ukraine conflict"
- Display 3-6 most recent relevant videos
- Update video list daily
- Show thumbnail, title, channel, and view count

## File Structure Expected
```
/app
  /api
    /casualties
    /scrape
    /videos
  /components
    - StatsCard.tsx
    - AdBanner.tsx
    - VideoCard.tsx
    - Chart.tsx
  page.tsx
  layout.tsx
  globals.css
/lib
  - supabase.ts
  - scrapers.ts
  - youtube.ts
/types
  - index.ts
```

## Environment Variables Needed
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
YOUTUBE_API_KEY=
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=
```

## Deployment Requirements
- Deploy to Vercel with automatic GitHub integration
- Set up Vercel Cron Jobs for data scraping every 6 hours
- Configure environment variables for production
- Enable error monitoring and analytics

Create a production-ready, scalable application that can handle high traffic and provides accurate, real-time war casualty tracking with proper monetization through Google Ads.
```

This prompt gives Cursor everything needed to create your complete NextJS project with all the features, styling, and functionality from your HTML prototype!