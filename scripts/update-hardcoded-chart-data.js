#!/usr/bin/env node

/**
 * Script to update ALL hardcoded data after scraping runs
 * This should be called by the cron job after new data is scraped
 * 
 * Usage: node scripts/update-hardcoded-chart-data.js
 * 
 * This script:
 * 1. Updates hardcoded casualty totals from latest scraped data
 * 2. Updates hardcoded chart data from latest scraped data
 * 3. Updates hardcoded YouTube video data from YouTube API
 * 4. Cleans up temporary files
 * 
 * The generated files are:
 * - src/data/hardcoded-casualty-totals.json & .ts (Casualty totals)
 * - src/data/hardcoded-chart-data.json & .ts (Chart data)
 * - src/data/hardcoded-youtube-data.json & .ts (YouTube video data)
 */

const { execSync } = require('child_process');
const path = require('path');

async function updateHardcodedData() {
  try {
    console.log('🔄 Updating ALL hardcoded data after scraping...');
    
    const casualtyScriptPath = path.join(__dirname, 'generate-hardcoded-casualty-totals-simple.js');
    const chartScriptPath = path.join(__dirname, 'generate-hardcoded-chart-data.ts');
    const youtubeScriptPath = path.join(__dirname, 'generate-hardcoded-youtube-data.ts');
    
    // Update casualty totals first
    console.log('💀 Updating casualty totals...');
    execSync(`node "${casualtyScriptPath}"`, {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    
    // Update chart data
    console.log('📊 Updating chart data...');
    console.log('📦 Compiling chart data script...');
    execSync(`npx tsc "${chartScriptPath}" --outDir scripts --target es2022 --module commonjs --moduleResolution node --esModuleInterop`, {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    
    console.log('🚀 Running chart data generation...');
    execSync('node scripts/generate-hardcoded-chart-data.js', {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    
    // Update YouTube data
    console.log('🎥 Updating YouTube video data...');
    console.log('📦 Compiling YouTube data script...');
    execSync(`npx tsc "${youtubeScriptPath}" --outDir scripts --target es2022 --module commonjs --moduleResolution node --esModuleInterop`, {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    
    console.log('🚀 Running YouTube data generation...');
    execSync('node scripts/generate-hardcoded-youtube-data.js', {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    
    // Clean up compiled JS files
    const fs = require('fs');
    const chartCompiledFile = path.join(process.cwd(), 'scripts', 'generate-hardcoded-chart-data.js');
    const youtubeCompiledFile = path.join(process.cwd(), 'scripts', 'generate-hardcoded-youtube-data.js');
    
    if (fs.existsSync(chartCompiledFile)) {
      fs.unlinkSync(chartCompiledFile);
      console.log('🧹 Cleaned up chart data compiled file');
    }
    
    if (fs.existsSync(youtubeCompiledFile)) {
      fs.unlinkSync(youtubeCompiledFile);
      console.log('🧹 Cleaned up YouTube data compiled file');
    }
    
    console.log('✅ ALL hardcoded data updated successfully!');
    console.log('📊 Summary: Casualty totals, Chart data, and YouTube videos are now hardcoded');
    
  } catch (error) {
    console.error('❌ Failed to update hardcoded data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  updateHardcodedData();
}

module.exports = { updateHardcodedData };
