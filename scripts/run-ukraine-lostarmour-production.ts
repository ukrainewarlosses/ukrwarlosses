#!/usr/bin/env tsx

import { createLostArmourCombinedScraper } from '../src/lib/lostarmour-combined-scraper';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

async function runUkraineLostArmourProduction() {
  console.log('🚀 Starting Ukraine Lost Armour Production Pipeline...\n');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Scrape both deaths and missing persons from Lost Armour
    console.log('📊 STEP 1: Scraping Ukrainian casualties from Lost Armour...');
    console.log('   - Deaths: https://lostarmour.info/panel/next/api/public/ukr200/search');
    console.log('   - Missing: https://lostarmour.info/panel/next/api/public/ukr-mia/search');
    
    const scraper = createLostArmourCombinedScraper({
      delayBetweenRequests: 1500, // Be respectful to their API
      maxRetries: 3,
      enableCaching: true,
      testMode: false // Full production mode
    });
    
    const combinedRecords = await scraper.scrapeAllData();
    
    // Generate summary
    scraper.generateSummary(combinedRecords);
    
    // Save combined data
    const savedPath = await scraper.saveToFile(combinedRecords);
    
    const scrapingTime = (Date.now() - startTime) / 1000;
    console.log(`✅ Step 1 completed: Scraping successful!`);
    console.log(`⏱️  Scraping time: ${(scrapingTime / 60).toFixed(1)} minutes`);
    console.log(`📊 Total records: ${combinedRecords.length.toLocaleString()}`);
    console.log(`💾 Data saved: ${savedPath}`);
    
    // Step 2: Deduplicate the data
    console.log('\n📊 STEP 2: Deduplicating Ukrainian data...');
    const dedupeStartTime = Date.now();
    
    try {
      execSync('npx tsx scripts/deduplicate-ukraine-lostarmour.ts', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      const dedupeTime = (Date.now() - dedupeStartTime) / 1000;
      console.log(`✅ Step 2 completed: Deduplication successful!`);
      console.log(`⏱️  Deduplication time: ${dedupeTime.toFixed(1)} seconds`);
      
    } catch (error) {
      console.error('❌ Step 2 failed: Deduplication error');
      console.error(error);
      // Continue with compilation even if deduplication fails
    }
    
    // Step 3: Compile monthly data (raw)
    console.log('\n📊 STEP 3: Compiling monthly data from raw records...');
    const compileStartTime = Date.now();
    
    try {
      execSync('npx tsx scripts/compile-ukraine-monthly.ts', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      const compileTime = (Date.now() - compileStartTime) / 1000;
      console.log(`✅ Step 3 completed: Monthly compilation successful!`);
      console.log(`⏱️  Compilation time: ${compileTime.toFixed(1)} seconds`);
      
    } catch (error) {
      console.error('❌ Step 3 failed: Monthly compilation error');
      console.error(error);
      throw error;
    }
    
    // Step 4: Compile monthly data (deduplicated) if deduplication succeeded
    console.log('\n📊 STEP 4: Compiling monthly data from deduplicated records...');
    const deduplicatedPath = path.join(process.cwd(), 'src', 'data', 'ukraine', 'soldiers.json');
    
    try {
      await fs.access(deduplicatedPath);
      
      execSync('npx tsx scripts/compile-ukraine-monthly-deduplicated.ts', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log(`✅ Step 4 completed: Deduplicated monthly compilation successful!`);
      
    } catch (error) {
      console.log('⚠️  Step 4 skipped: No deduplicated data found or compilation failed');
      console.log('   This is not critical - raw data compilation succeeded');
    }
    
    // Step 5: Summary and next steps
    const totalTime = (Date.now() - startTime) / 1000;
    console.log('\n🎉 UKRAINE LOST ARMOUR PRODUCTION PIPELINE COMPLETED!');
    console.log(`⏱️  Total time: ${(totalTime / 60).toFixed(1)} minutes`);
    
    console.log('\n📊 RESULTS:');
    console.log(`   Raw records: ${combinedRecords.length.toLocaleString()}`);
    console.log(`   Deaths: ${combinedRecords.filter(r => r.recordType === 'death').length.toLocaleString()}`);
    console.log(`   Missing: ${combinedRecords.filter(r => r.recordType === 'missing').length.toLocaleString()}`);
    
    // Check for generated files
    const dataDir = path.join(process.cwd(), 'src', 'data', 'ukraine');
    const files = await fs.readdir(dataDir);
    
    console.log('\n📁 Generated files:');
    const relevantFiles = files.filter(f => 
      f.includes('soldiers-raw.json') || 
      f.includes('soldiers.json') || 
      f.includes('monthly-')
    );
    
    for (const file of relevantFiles) {
      const filePath = path.join(dataDir, file);
      const stats = await fs.stat(filePath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
      console.log(`   ${file} (${sizeMB} MB)`);
    }
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. The chart will now use the new Lost Armour data');
    console.log('   2. Data is much cleaner with no duplicates from website glitches');
    console.log('   3. Missing persons are now properly categorized');
    console.log('   4. Run "npm run dev" to see updated charts');
    
    console.log('\n✅ Production pipeline completed successfully!');
    
  } catch (error) {
    console.error('❌ Production pipeline failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Pipeline interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Pipeline terminated');
  process.exit(1);
});

runUkraineLostArmourProduction();
