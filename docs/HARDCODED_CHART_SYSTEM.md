# Hardcoded Chart System

## Overview

The chart data system has been refactored to use hardcoded data instead of API calls. This improves performance by eliminating client-side API requests and ensures data consistency.

## Architecture

### Before
- Chart component received data via props from server-side data loading
- Data was processed in real-time during component rendering
- Multiple API endpoints existed for testing and debugging

### After
- Chart component uses pre-processed hardcoded data
- Data is generated offline and embedded in the build
- No API calls are made by end users for chart rendering

## Files

### Generated Data Files
- `src/data/hardcoded-chart-data.json` - JSON format data
- `src/data/hardcoded-chart-data.ts` - TypeScript module with exported data

### Scripts
- `scripts/generate-hardcoded-chart-data.ts` - TypeScript script to generate hardcoded data
- `scripts/update-hardcoded-chart-data.js` - Node.js wrapper script for cron jobs

### Modified Components
- `src/components/Chart.tsx` - Now imports and uses hardcoded data
- `src/app/page.tsx` - Removed chart data props and historical data loading
- `src/types/index.ts` - Removed ChartProps interface
- `src/lib/dataLoader.ts` - Removed client-side data loading function

### Removed Files
- `src/app/api/test-chart/` - Test API endpoint no longer needed

## Data Structure

**Important**: The system now has three separate hardcoded data types:

1. **Casualty Totals** (`src/data/hardcoded-casualty-totals.ts`): Current snapshot totals displayed on homepage
2. **Chart Data** (`src/data/hardcoded-chart-data.ts`): Historical monthly/weekly data for trend visualization  
3. **YouTube Data** (`src/data/hardcoded-youtube-data.ts`): Latest videos from History Legends channel

The hardcoded chart data contains:

```typescript
interface HardcodedChartData {
  monthly: ChartData[];
  weekly: ChartData[];
  lastUpdated: string;
}

interface ChartData {
  date: string;
  isoDate: string;
  ukraineTotal: number;
  ukraineDeaths: number;
  ukraineMissing: number;
  ukraineTotalCumulative: number;
  russiaDeaths: number;
  russiaTotalCumulative: number;
}
```

## Update Process

When the scraping cron job runs, it should call the update script to regenerate the hardcoded data:

```bash
node scripts/update-hardcoded-chart-data.js
```

This script:
1. Compiles the TypeScript generation script
2. Reads the latest data files from `src/data/ukraine/` and `src/data/russia/`
3. Processes the data (filtering, sorting, calculating cumulatives)
4. Generates both JSON and TypeScript versions
5. Cleans up temporary files

## Benefits

1. **Performance**: No client-side API calls for chart data
2. **Reliability**: Data is embedded in the build, always available
3. **Consistency**: Data processing happens once, not on every page load
4. **Caching**: Static data can be cached more effectively
5. **Build-time Optimization**: Next.js can optimize the bundle with static data

## Integration with Cron Jobs

Add this line to your scraping cron job after data processing:

```bash
node /path/to/project/scripts/update-hardcoded-chart-data.js
```

This ensures the chart data is updated whenever new scraped data is available.

## Development

To manually update the hardcoded data during development:

```bash
# Generate new hardcoded data
npx tsc scripts/generate-hardcoded-chart-data.ts --outDir . --target es2022 --module commonjs --moduleResolution node --esModuleInterop
node generate-hardcoded-chart-data.js
rm generate-hardcoded-chart-data.js

# Or use the wrapper script
node scripts/update-hardcoded-chart-data.js
```

## Monitoring

The chart component logs information about the loaded data:

```javascript
console.log(`Chart loading ${timePeriod} hardcoded data:`, {
  dataPoints: data.length,
  firstPoint: data[0]?.date,
  lastPoint: data[data.length - 1]?.date,
  lastUpdated: hardcodedChartData.lastUpdated
});
```

Check browser console to verify data is loading correctly and see when it was last updated.
