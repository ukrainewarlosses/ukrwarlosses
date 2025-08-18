import { createUkrainianLossesScraper } from '../src/lib/ukraine-losses-scraper';
import { DateParser } from '../src/lib/date-parser';

async function testScraper(): Promise<void> {
  console.log('🧪 Testing Ukrainian Losses Scraper...\n');

  try {
    // Test date parser first
    console.log('📅 Testing Date Parser:');
    const testDates = [
      'March 16, 2024',
      'Mar. 16, 2024',
      '(Feb. 17, 2025)',
      'July 4, 1966',
      'Jan. 19, 1981',
      'Invalid date format'
    ];

    testDates.forEach(dateStr => {
      const result = DateParser.parseDate(dateStr);
      console.log(`  "${dateStr}" -> ${result.date ? result.date.toISOString().split('T')[0] : 'null'} (estimated: ${result.isEstimated})`);
    });

    // Test date range parsing
    console.log('\n📅 Testing Date Range Parser:');
    const testRanges = [
      'Brazhko Ihor Volodymyrovych July 4, 1966 - March 16, 2024',
      'John Doe Jan. 19, 1981 - (Feb. 17, 2025)'
    ];

    testRanges.forEach(rangeStr => {
      const result = DateParser.parseDateRange(rangeStr);
      console.log(`  Birth: ${result.birthDate.date ? result.birthDate.date.toISOString().split('T')[0] : 'null'}`);
      console.log(`  Death: ${result.deathDate.date ? result.deathDate.date.toISOString().split('T')[0] : 'null'} (estimated: ${result.deathDate.isEstimated})`);
    });

    // Test scraper with minimal configuration
    console.log('\n🕷️ Testing Scraper (limited pages):');
    const scraper = createUkrainianLossesScraper({
      maxPages: 5, // Very limited for testing
      delayBetweenRequests: 1000,
      retryAttempts: 2,
      enableCaching: true
    });

    const result = await scraper.scrape();
    
    console.log('\n📊 Scraping Results:');
    console.log('  Total casualties found:', result.summary.totalEntries);
    console.log('  Valid death dates:', result.summary.validDeathDates);
    console.log('  Confirmed deaths:', result.summary.confirmedDeaths);
    console.log('  Estimated deaths:', result.summary.estimatedDeaths);
    console.log('  Failed parses:', result.summary.failedParses);
    console.log('  Pages scraped:', result.scrapedPages, '/', result.totalPages);

    if (result.casualties.length > 0) {
      console.log('\n📋 Sample casualties:');
      result.casualties.slice(0, 3).forEach((casualty, i) => {
        console.log(`  ${i + 1}. ${casualty.name}`);
        console.log(`     Birth: ${casualty.birthDate || 'unknown'}`);
        console.log(`     Death: ${casualty.deathDate || 'unknown'} ${casualty.isEstimated ? '(estimated)' : ''}`);
      });

      // Test monthly aggregation
      console.log('\n📈 Testing Monthly Aggregation:');
      const monthlyData = await scraper.aggregateByMonth(result.casualties);
      console.log('  Monthly data points:', monthlyData.length);
      
      if (monthlyData.length > 0) {
        console.log('  Sample months:');
        monthlyData.slice(0, 5).forEach(month => {
          console.log(`    ${month.date}: ${month.casualties} total (${month.confirmed || 0} confirmed, ${month.unconfirmed || 0} estimated)`);
        });

        // Test scaling
        console.log('\n⚖️ Testing Scaling to Known Total:');
        const scaledData = await scraper.scaleToTotal(monthlyData, 158892);
        console.log('  Scaled monthly data points:', scaledData.length);
        
        if (scaledData.length > 0) {
          const totalScaled = scaledData.reduce((sum, item) => sum + item.casualties, 0);
          console.log('  Total after scaling:', totalScaled);
          console.log('  Sample scaled months:');
          scaledData.slice(0, 5).forEach(month => {
            console.log(`    ${month.date}: ${month.casualties} total (${month.confirmed || 0} confirmed, ${month.unconfirmed || 0} estimated)`);
          });
        }
      }
    }

    if (result.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      result.errors.slice(0, 3).forEach(error => console.log(`  - ${error}`));
    }

    console.log('\n✅ Scraper test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testScraper().catch(console.error);
}

export { testScraper };
