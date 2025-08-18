# Ukrainian War Losses Scraper Documentation

## Overview

This enhanced scraper system extracts individual casualty data from the Ukrainian war losses memorial website (https://ualosses.org/en/soldiers/) and aggregates it into monthly statistics for visualization in charts.

## Architecture

### Core Components

1. **UkrainianLossesScraper** (`src/lib/ukraine-losses-scraper.ts`)
   - Main scraper class using Playwright for dynamic content handling
   - Implements proper rate limiting, retry logic, and error handling
   - Supports both sample-based and full scraping modes

2. **DateParser** (`src/lib/date-parser.ts`)
   - Comprehensive date parsing utility
   - Handles various date formats from the memorial website
   - Distinguishes between confirmed and estimated death dates

3. **ComprehensiveWarLossesScraper** (`src/lib/comprehensive-scraper.ts`)
   - Integration layer that combines Ukrainian and Russian data
   - Orchestrates the complete data pipeline

## Features

### Enhanced Data Extraction
- **Dynamic Content Rendering**: Uses Playwright instead of Puppeteer for better JavaScript handling
- **Multiple Date Formats**: Parses various date formats including:
  - "March 16, 2024"
  - "Mar. 16, 2024"
  - "(Feb. 17, 2025)" (estimated dates in parentheses)
- **Confirmed vs Unconfirmed**: Separates confirmed casualties from estimated ones
- **Error Recovery**: Graceful handling of malformed data and network issues

### Smart Sampling Strategy
- **Representative Sampling**: Intelligently selects pages across the entire dataset
- **Scalable Architecture**: Can handle both full scrapes and sample-based extractions
- **Statistical Scaling**: Accurately scales sample data to match known totals

### Data Processing Pipeline
- **Monthly Aggregation**: Groups casualties by death month
- **Data Validation**: Ensures dates fall within reasonable war timeframes
- **Caching System**: Stores results locally for backup and incremental updates

## Configuration Options

```typescript
interface ScrapingConfig {
  maxPages?: number;           // Maximum pages to scrape (default: 50)
  delayBetweenRequests?: number; // Delay in ms (default: 2000)
  retryAttempts?: number;      // Retry failed requests (default: 3)
  enableCaching?: boolean;     // Enable local caching (default: true)
  incrementalUpdate?: boolean; // Only fetch new data (default: false)
}
```

## Usage Examples

### Basic Usage
```typescript
import { createUkrainianLossesScraper } from '@/lib/ukraine-losses-scraper';

const scraper = createUkrainianLossesScraper({
  maxPages: 100,
  delayBetweenRequests: 2000,
  enableCaching: true
});

const result = await scraper.scrape();
const monthlyData = await scraper.aggregateByMonth(result.casualties);
const scaledData = await scraper.scaleToTotal(monthlyData, 158892);
```

### Integration with Existing System
```typescript
// In comprehensive-scraper.ts
const scraper = createUkrainianLossesScraper({
  maxPages: 100,
  delayBetweenRequests: 2000,
  retryAttempts: 3,
  enableCaching: true
});

const scrapingResult = await scraper.scrape();
const monthlyData = await scraper.aggregateByMonth(scrapingResult.casualties);
const scaledData = await scraper.scaleToTotal(monthlyData, 158892);
```

## Data Formats

### Casualty Entry
```typescript
interface CasualtyEntry {
  name: string;
  birthDate?: string;
  deathDate?: string;
  location?: string;
  isEstimated?: boolean; // Death date in parentheses
}
```

### Historical Data Output
```typescript
interface HistoricalData {
  date: string;        // YYYY-MM-DD format
  casualties: number;  // Total casualties for the month
  confirmed?: number;  // Confirmed casualties
  unconfirmed?: number; // Estimated casualties
}
```

### Scraping Result
```typescript
interface ScrapingResult {
  casualties: CasualtyEntry[];
  totalPages: number;
  scrapedPages: number;
  errors: string[];
  summary: {
    totalEntries: number;
    validDeathDates: number;
    estimatedDeaths: number;
    confirmedDeaths: number;
    failedParses: number;
  };
}
```

## Error Handling

### Network Errors
- Automatic retry with exponential backoff
- Graceful degradation to fallback data
- Comprehensive error logging

### Data Parsing Errors
- Individual entry failures don't stop the entire process
- Detailed logging of parsing failures
- Statistical summaries of data quality

### Site Structure Changes
- Multiple selector strategies for finding content
- Flexible pattern matching for different layouts
- Fallback to known data patterns

## Performance Considerations

### Rate Limiting
- 2-3 second delays between requests by default
- Respectful of server resources
- Configurable timing based on site responsiveness

### Memory Management
- Streaming data processing where possible
- Efficient date parsing algorithms
- Garbage collection friendly patterns

### Caching Strategy
- Local file system caching
- Incremental update support
- Backup of raw scraped data

## Testing

### Unit Tests
```bash
npm run test-scraper
```

### Test Coverage
- Date parser validation with various formats
- Scraper functionality with limited pages
- Monthly aggregation accuracy
- Scaling algorithm validation

## Monitoring and Maintenance

### Logging
- Comprehensive logging to console and files
- Timestamp-based log entries
- Error categorization and reporting

### Data Validation
- Sanity checks on casualty counts
- Date range validation
- Cross-reference with known totals

### Maintenance Alerts
- Detection of significant data changes
- Site structure change warnings
- Performance degradation monitoring

## API Integration

### Scrape Endpoint
```
POST /api/scrape
```
Triggers the comprehensive scraping process including the enhanced Ukrainian scraper.

### Data Endpoint
```
GET /api/data
```
Returns the latest scraped and processed data including monthly Ukrainian casualties.

## Future Enhancements

### Planned Features
1. **Real-time Updates**: WebSocket integration for live data updates
2. **Machine Learning**: Pattern recognition for improved data extraction
3. **Multi-language Support**: Support for Ukrainian language pages
4. **Geographic Analysis**: Location-based casualty mapping
5. **Trend Analysis**: Advanced statistical analysis of casualty patterns

### Scalability Improvements
1. **Distributed Scraping**: Multiple worker processes
2. **Database Integration**: Direct database storage for large datasets
3. **API Rate Limiting**: Intelligent request throttling
4. **CDN Integration**: Cached results distribution

## Troubleshooting

### Common Issues

1. **No Data Extracted**
   - Check internet connectivity
   - Verify site accessibility
   - Review selector patterns

2. **High Error Rates**
   - Increase delay between requests
   - Check for site structure changes
   - Verify Playwright installation

3. **Memory Issues**
   - Reduce maxPages configuration
   - Enable incremental updates
   - Monitor system resources

### Debug Mode
Set environment variable `DEBUG_SCRAPER=true` for detailed logging.

## Security Considerations

### Privacy
- No personal data storage beyond memorial information
- Respectful scraping practices
- Compliance with site terms of service

### Data Integrity
- Cryptographic hashing of cached data
- Validation against known totals
- Audit trails for all modifications

## Contributing

When contributing to the scraper:

1. Follow existing code patterns
2. Add comprehensive tests
3. Update documentation
4. Consider performance impact
5. Respect rate limiting guidelines

## License

This scraper is part of the Ukrainian War Losses Tracker project and follows the same licensing terms.
