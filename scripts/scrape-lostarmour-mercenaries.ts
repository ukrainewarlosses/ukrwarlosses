#!/usr/bin/env tsx

import { createLostArmourMercenariesScraper } from '../src/lib/lostarmour-mercenaries-scraper';

async function runLostArmourMercenariesScraper() {
  console.log('🚀 Starting Lost Armour Mercenaries Scraper...\n');
  
  const startTime = Date.now();
  
  try {
    // Create scraper
    const scraper = createLostArmourMercenariesScraper({
      delayBetweenRequests: 2000, // Be respectful to their server
      maxRetries: 3,
      enableCaching: true
    });
    
    // Scrape mercenaries
    const records = await scraper.scrapeMercenaries();
    
    // Save the data
    const savedPath = await scraper.saveToFile(records);
    
    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\n✅ Scraping completed successfully!`);
    console.log(`⏱️  Total time: ${(totalTime / 60).toFixed(1)} minutes`);
    console.log(`📊 Total records: ${records.length.toLocaleString()}`);
    console.log(`💾 Data saved: ${savedPath}`);
    
    // Generate summary
    const countries = new Map<string, number>();
    
    records.forEach(record => {
      const country = record.citizenship || 'Unknown';
      countries.set(country, (countries.get(country) || 0) + 1);
    });
    
    console.log(`\n📊 Summary by Country:`);
    Array.from(countries.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([country, count]) => {
        console.log(`   ${country}: ${count}`);
      });
    
    // Date range analysis
    const dates = records
      .map(r => r.dateOfDeath)
      .filter(Boolean)
      .sort();
    
    if (dates.length > 0) {
      console.log(`\n📅 Date range: ${dates[dates.length - 1]} to ${dates[0]}`);
    }
    
  } catch (error) {
    console.error('❌ Error during scraping:', error);
    process.exit(1);
  }
}

// Run the scraper
runLostArmourMercenariesScraper().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

