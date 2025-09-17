# Ukraine-Russia War Personnel Losses Tracker

A high-performance, database-free NextJS 14 static website that provides real-time tracking of military personnel casualties in the Ukraine-Russia conflict. All data is scraped directly from official sources and stored as static JSON files.

## Features

- **Database-Free Architecture**: No database required - all data stored as static JSON files
- **Enhanced Web Scraping**: Advanced Playwright-based scraper extracts individual death dates from Ukrainian memorial website
- **Real Memorial Data**: Actual casualty data from [ualosses.org](https://ualosses.org/en/soldiers/) with confirmed vs estimated death dates
- **Ukrainian Casualty Breakdown**: Dead, missing, and prisoners data with monthly historical patterns from real memorial entries
- **Russian Casualty Tracking**: Verified named list of personnel losses from Zona Media (excludes unverified estimates)
- **Dual Historical Trends**: Both Ukrainian and Russian monthly casualty data with interactive dual-line charts
- **Monthly Automated Updates**: Comprehensive scraping on the 1st of each month for fresh data
- **Lazy YouTube Embeds**: Click-to-load YouTube videos for optimal performance
- **Dark Theme**: Professional dark theme matching the design specifications
- **Responsive Design**: Mobile-first design that works on all devices
- **SEO Optimized**: Complete meta tags, structured data, sitemap, and PWA manifest
- **Google AdSense**: Integrated monetization with proper ad placements
- **Performance Optimized**: Static generation with smart caching,CSV parsing, and optimization

## Tech Stack

- **Frontend**: NextJS 14 with App Router, TypeScript, Tailwind CSS
- **Data Storage**: Static JSON files (no database required)
- **Scraping**: Playwright for enhanced web scraping with comprehensive date parsing
- **Charts**: Recharts for historical data visualization
- **Videos**: Direct YouTube embeds with lazy loading
- **Optimization**: Vercel image optimization, smart caching, asset compression
- **Deployment**: Vercel with automatic deployment and cron jobs

## Data Sources

- **Ukrainian Casualties**: [ualosses.org/en/soldiers/](https://ualosses.org/en/soldiers/) - Total losses with breakdown (dead/missing/prisoners)
- **Ukrainian Historical Data**: Individual death dates scraped from memorial pages, aggregated into monthly statistics with confirmed vs estimated separation  
- **Russian Casualties**: [Zona Media](https://en.zona.media/article/2025/08/01/casualties_eng-trl) - Verified named list of personnel losses (CSV historical data available)
- **Russian Historical Data**: CSV file download from Zona Media for comprehensive historical trends

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── casualties/
│   │   │   ├── scrape/
│   │   │   └── videos/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── AdBanner.tsx
│   │   ├── Chart.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── SourceCard.tsx
│   │   ├── StatsCard.tsx
│   │   ├── UpdateIndicator.tsx
│   │   └── VideoCard.tsx
│   ├── lib/
│   │   ├── scrapers.ts
│   │   ├── supabase.ts
│   │   └── youtube.ts
│   └── types/
│       └── index.ts
├── database-schema.sql
├── next.config.js
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd ukrwarlosses
npm install
```

### 2. Environment Variables

Create a `.env.local` file based on `.env.example`:

```env
# Google AdSense (optional)
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-your-adsense-id

# Base URL (for production)
NEXT_PUBLIC_BASE_URL=https://ukrainewarlosses.org

# Environment (development uses mock data)
NODE_ENV=development
```

### 3. Data Setup

#### Option A: Using Vercel Blob Storage (Recommended for Production)

The application now uses Vercel Blob Storage to store large data files, preventing serverless function size limits.

1. **Upload data files to blob storage:**
   ```bash
   npm run upload-to-blob
   ```

2. **Add environment variables to your Vercel project:**
   The upload script will output the required environment variables. Add them to your Vercel project settings:
   - `UKRAINE_SOLDIERS_BLOB_URL`
   - `UKRAINE_MONTHLY_BLOB_URL`
   - `RUSSIA_MONTHLY_BLOB_URL`
   - `UKRAINE_WEEKLY_BLOB_URL`
   - `RUSSIA_WEEKLY_BLOB_URL`

3. **For local development, add to `.env.local`:**
   ```env
   UKRAINE_SOLDIERS_BLOB_URL=your-blob-url
   UKRAINE_MONTHLY_BLOB_URL=your-blob-url
   RUSSIA_MONTHLY_BLOB_URL=your-blob-url
   UKRAINE_WEEKLY_BLOB_URL=your-blob-url
   RUSSIA_WEEKLY_BLOB_URL=your-blob-url
   ```

#### Option B: Local Data Files (Development Only)

No database setup required! The application uses static JSON files:

- Data is automatically generated from the mock scraper in development
- In production, data is scraped from official sources daily
- All data is stored in `src/data/casualties.json`

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

The development server will use mock data from `src/data/casualties.json`. In production, this file is updated daily by the scraper.

## API Endpoints

- `GET /api/data` - Get all casualty data from static JSON file (cached)
- `POST /api/scrape` - Trigger daily data scraping (cron job)
- `GET /api/scrape?action=status` - Check scraper status

Note: No database queries - all data served from static JSON files for optimal performance.

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard (only Google AdSense ID needed)
3. Deploy automatically on push to main branch

The application requires **no database setup** - all data is stored as static files.

### Vercel Cron Jobs

The application includes automatic monthly scraping at 2 AM UTC on the 1st of each month:

```json
{
  "crons": [
    {
      "path": "/api/scrape",
      "schedule": "0 2 1 * *"
    }
  ]
}
```

The scraper updates `src/data/casualties.json` with fresh data from:
- **Ukrainian casualties** from https://ualosses.org/en/soldiers/ (with dead/missing/prisoners breakdown and individual death dates)
- **Ukrainian historical** data extracted from memorial pages with confirmed vs estimated death dates
- **Russian casualties** from https://en.zona.media/article/2025/08/01/casualties_eng-trl (CSV download for historical data)

## Google AdSense Setup

1. Apply for Google AdSense approval
2. Add your AdSense ID to environment variables
3. Replace placeholder ad slots in the code with your actual ad unit IDs
4. Uncomment the actual AdSense code in `AdBanner.tsx`

## Customization

### Colors and Styling

The application uses a custom color palette defined in `tailwind.config.js`:

- Background: `#1b1b1b`
- Card Background: `#2a2a2a`
- Primary Accent: `#d4a574`
- Casualty Red: `#ff6b6b`

### Data Sources

To modify data sources:

1. Update URLs in `src/lib/scrapers.ts`
2. Adjust CSS selectors for scraping
3. Update source information in the homepage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This application tracks publicly available casualty data from open sources. Numbers represent confirmed minimum losses and actual figures may be higher due to unreported casualties and classification restrictions. The application is not affiliated with any government or military organization.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
