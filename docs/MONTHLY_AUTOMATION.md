# Monthly Automated Scraping Documentation

## Overview

The Ukrainian War Losses Tracker automatically updates casualty data on the 1st of each month at 2 AM UTC using real data scraped from the Ukrainian memorial website.

## Automation Methods

### 1. GitHub Actions (Primary)
- **File**: `.github/workflows/monthly-scrape.yml`
- **Schedule**: `0 2 1 * *` (2 AM UTC on 1st of each month)
- **Features**:
  - Automated data scraping and processing
  - Git commit and push of updated data
  - Summary report generation
  - Error handling and notifications

### 2. Vercel Cron Jobs (Backup)
- **File**: `vercel.json`
- **Schedule**: `0 2 1 * *` (2 AM UTC on 1st of each month)
- **Endpoint**: `/api/scrape`
- **Timeout**: 300 seconds (5 minutes)

## What Happens During Monthly Updates

### Data Collection Process
1. **Enhanced Scraper Activation**: Playwright-based scraper launches
2. **Sample Collection**: 500 representative pages scraped from ualosses.org
3. **Date Parsing**: Individual death dates extracted and validated
4. **Monthly Aggregation**: Casualties grouped by month with confirmed/unconfirmed separation
5. **Statistical Scaling**: Sample data scaled to match known totals
6. **Data Validation**: Sanity checks and quality assurance

### File Updates
- `src/data/casualties.json` - Main data file with updated monthly statistics
- `cache/ukraine-losses/` - Raw scraping results for backup and debugging
- Git commit with descriptive message including month/year

### Data Quality Metrics
- **Sample Size**: ~500 pages from 1,500+ total pages
- **Accuracy**: Scaled to match official total (158,892 as of August 2024)
- **Coverage**: February 2022 to present
- **Reliability**: Confirmed vs unconfirmed casualties properly categorized

## Schedule Details

### Timing Rationale
- **1st of month**: Allows time for new memorial entries to be added
- **2 AM UTC**: Low traffic time to minimize server load
- **Monthly frequency**: Balances data freshness with respectful scraping

### Time Zone Conversions
- **UTC**: 2:00 AM
- **EST**: 9:00 PM (previous day) / 10:00 PM (DST)
- **PST**: 6:00 PM (previous day) / 7:00 PM (DST)
- **CET**: 3:00 AM / 4:00 AM (DST)

## Monitoring and Alerts

### Success Indicators
- Updated `lastUpdated` timestamp in casualties.json
- New git commit with monthly data
- GitHub Actions summary report
- No error logs in application monitoring

### Failure Scenarios
- Network connectivity issues
- Website structure changes
- Rate limiting responses
- Data validation failures

### Manual Intervention
If automated scraping fails:
```bash
# Manual trigger via API
curl -X POST https://your-domain.com/api/scrape

# Or run locally
npm run dev
curl -X POST http://localhost:3000/api/scrape
```

## Data Backup and Recovery

### Automatic Backups
- **Git History**: All updates tracked in version control
- **Cache Files**: Raw scraping results stored locally
- **Vercel Logs**: Detailed execution logs for debugging

### Recovery Process
1. Check git history for last successful update
2. Review cache files for raw data
3. Manually trigger scraper if needed
4. Validate data integrity after recovery

## Configuration Management

### Environment Variables
- `NODE_ENV`: Set to 'production' for automated runs
- `YOUTUBE_API_KEY`: For video content updates
- `DEBUG_SCRAPER`: Enable detailed logging if needed

### Scraper Configuration
```typescript
{
  maxPages: 500,           // Large sample for accuracy
  delayBetweenRequests: 2000,  // Respectful rate limiting
  retryAttempts: 3,        // Error resilience
  enableCaching: true,     // Backup and debugging
  incrementalUpdate: false // Full refresh monthly
}
```

## Performance Metrics

### Expected Runtime
- **Scraping Phase**: 15-20 minutes (500 pages × 2-3 seconds)
- **Processing Phase**: 2-3 minutes
- **Total Duration**: ~20-25 minutes

### Resource Usage
- **Memory**: ~500MB peak during scraping
- **Network**: ~50-100 MB data transfer
- **Storage**: ~10-20 MB cache files per run

## Maintenance Tasks

### Monthly Review (Recommended)
1. Verify data accuracy against known sources
2. Check for website structure changes
3. Review error logs and performance metrics
4. Update scraper patterns if needed

### Quarterly Tasks
1. Update Playwright and dependencies
2. Review and optimize scraper configuration
3. Validate data trends and patterns
4. Performance optimization

### Annual Tasks
1. Comprehensive data validation
2. Archive old cache files
3. Update documentation
4. Security review and updates

## Troubleshooting Guide

### Common Issues

#### 1. No Data Updated
**Symptoms**: No new git commit, same lastUpdated timestamp
**Solutions**:
- Check GitHub Actions logs
- Verify Vercel cron job status
- Test manual API call
- Check network connectivity

#### 2. Partial Data Updates
**Symptoms**: Some months missing, inconsistent patterns
**Solutions**:
- Review scraper error logs
- Check for website changes
- Validate date parsing logic
- Increase sample size temporarily

#### 3. Scaling Issues
**Symptoms**: Unrealistic monthly totals
**Solutions**:
- Verify known total accuracy
- Check sample representativeness
- Review scaling algorithm
- Manual validation of sample data

#### 4. Performance Degradation
**Symptoms**: Timeouts, slow execution
**Solutions**:
- Reduce sample size temporarily
- Increase request delays
- Check server resources
- Optimize parsing logic

### Emergency Contacts
- **Primary**: Check GitHub repository issues
- **Secondary**: Review Vercel dashboard logs
- **Fallback**: Manual data collection and update

## Future Enhancements

### Planned Improvements
1. **Real-time Updates**: WebSocket integration for live data
2. **Multiple Sources**: Cross-reference with other memorial sites
3. **Geographic Analysis**: Location-based casualty mapping
4. **Trend Prediction**: Statistical forecasting models
5. **Data Validation**: Cross-reference with official sources

### Scalability Considerations
1. **Distributed Scraping**: Multiple worker processes
2. **Database Migration**: Move from JSON to proper database
3. **API Rate Management**: Intelligent throttling
4. **CDN Integration**: Faster data distribution

## Compliance and Ethics

### Respectful Scraping
- 2-3 second delays between requests
- Limited concurrent connections
- Respectful of server resources
- Compliance with robots.txt

### Data Privacy
- Only public memorial information
- No personal data beyond memorial entries
- Transparent data usage
- Regular data audits

### Legal Considerations
- Fair use of public memorial data
- Attribution to original sources
- Compliance with applicable laws
- Respectful handling of sensitive information
