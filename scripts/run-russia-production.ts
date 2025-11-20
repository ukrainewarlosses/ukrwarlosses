#!/usr/bin/env tsx

import { createRussiaCasualtiesScraper } from '../src/lib/russia-casualties-scraper';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

async function runRussiaProduction() {
  console.log('🇷🇺 Starting Russia Casualties Production Pipeline...\n');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Scrape Russian casualties
    console.log('📊 STEP 1: Scraping Russian casualties from svo.rf.gd...');
    
    const scraper = createRussiaCasualtiesScraper({
      delayBetweenRequests: 2000, // Be respectful to their server
      maxRetries: 3,
      enableCaching: true,
      maxPages: undefined // Scrape all pages
    });
    
    const allRecords = await scraper.scrapeAllPages();
    
    // Save raw data
    const savedPath = await scraper.saveToFile(allRecords);
    
    const scrapingTime = (Date.now() - startTime) / 1000;
    console.log(`✅ Step 1 completed: Scraping successful!`);
    console.log(`⏱️  Scraping time: ${(scrapingTime / 60).toFixed(1)} minutes`);
    console.log(`📊 Total records: ${allRecords.length.toLocaleString()}`);
    console.log(`💾 Data saved: ${savedPath}`);
    
    // Step 2: Deduplicate the data
    console.log('\n📊 STEP 2: Deduplicating Russian data...');
    const dedupeStartTime = Date.now();
    
    try {
      execSync('npx tsx scripts/deduplicate-russia-data.ts', {
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
    
    // Step 3: Compile DAILY data
    console.log('\n📊 STEP 3: Compiling DAILY data...');
    const dailyCompileStartTime = Date.now();
    
    try {
      execSync('npx tsx scripts/compile-russia-daily.ts', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      const dailyCompileTime = (Date.now() - dailyCompileStartTime) / 1000;
      console.log(`✅ Step 3 completed: Daily compilation successful!`);
      console.log(`⏱️  Compilation time: ${dailyCompileTime.toFixed(1)} seconds`);
      
    } catch (error) {
      console.error('❌ Step 3 failed: Daily compilation error');
      console.error(error);
      throw error;
    }
    
    // Step 4: Compile WEEKLY data from daily data
    console.log('\n📊 STEP 4: Compiling WEEKLY data from daily data...');
    const weeklyCompileStartTime = Date.now();
    
    try {
      execSync('npx tsx scripts/compile-russia-weekly-from-daily.ts', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      const weeklyCompileTime = (Date.now() - weeklyCompileStartTime) / 1000;
      console.log(`✅ Step 4 completed: Weekly compilation successful!`);
      console.log(`⏱️  Compilation time: ${weeklyCompileTime.toFixed(1)} seconds`);
      
    } catch (error) {
      console.error('❌ Step 4 failed: Weekly compilation error');
      console.error(error);
      throw error;
    }
    
    // Step 5: Compile MONTHLY data from daily data
    console.log('\n📊 STEP 5: Compiling MONTHLY data from daily data...');
    const monthlyCompileStartTime = Date.now();
    
    try {
      execSync('npx tsx scripts/compile-russia-monthly-from-daily.ts', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      const monthlyCompileTime = (Date.now() - monthlyCompileStartTime) / 1000;
      console.log(`✅ Step 5 completed: Monthly compilation successful!`);
      console.log(`⏱️  Compilation time: ${monthlyCompileTime.toFixed(1)} seconds`);
      
    } catch (error) {
      console.error('❌ Step 5 failed: Monthly compilation error');
      console.error(error);
      throw error;
    }
    
    // Step 4: Summary
    const totalTime = (Date.now() - startTime) / 1000;
    console.log('\n🎉 RUSSIA CASUALTIES PRODUCTION PIPELINE COMPLETED!');
    console.log(`⏱️  Total time: ${(totalTime / 60).toFixed(1)} minutes`);
    console.log(`📊 Total records scraped: ${allRecords.length.toLocaleString()}`);
    
    // Check for generated files
    const dataDir = path.join(process.cwd(), 'src', 'data', 'russia');
    const files = await fs.readdir(dataDir);
    
    console.log('\n📁 Generated files:');
    const relevantFiles = files.filter(f => 
      f.includes('casualties') || 
      f.includes('monthly')
    );
    
    for (const file of relevantFiles) {
      const filePath = path.join(dataDir, file);
      const stats = await fs.stat(filePath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
      console.log(`   ${file} (${sizeMB} MB)`);
    }
    
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

runRussiaProduction();

