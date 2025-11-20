#!/usr/bin/env tsx

import { createZona200Scraper, Zona200Fighter } from '../src/lib/zona-200-scraper';
import fs from 'fs/promises';
import path from 'path';

// The list of 562 fighters provided by the user
const FIGHTERS_LIST: Zona200Fighter[] = [
  {
    "url": "Ёрбеков_Одилджон_Абиджанович",
    "name": "Ёрбеков Одилджон Абиджанович",
    "id": 101530,
    "color": 0
  },
  {
    "url": "Абдинов_Камран_Рауф_Оглы",
    "name": "Абдинов Камран Рауф Оглы",
    "id": 135802,
    "color": 0
  },
  // ... (rest of the list will be loaded from a JSON file)
];

async function loadFightersList(): Promise<Zona200Fighter[]> {
  // Try to load from a JSON file first
  const fightersFilePath = path.join(process.cwd(), 'scripts', 'zona-200-fighters-list.json');
  
  try {
    const fileContent = await fs.readFile(fightersFilePath, 'utf-8');
    const fighters = JSON.parse(fileContent);
    console.log(`📋 Loaded ${fighters.length} fighters from ${fightersFilePath}`);
    return fighters;
  } catch (error) {
    // Try alternative path
    const altPath = path.join(process.cwd(), 'zona-200-fighters-list.json');
    try {
      const fileContent = await fs.readFile(altPath, 'utf-8');
      const fighters = JSON.parse(fileContent);
      console.log(`📋 Loaded ${fighters.length} fighters from ${altPath}`);
      return fighters;
    } catch (altError) {
      console.error(`❌ Could not load fighters list from file!`);
      console.error(`   Tried: ${fightersFilePath}`);
      console.error(`   Tried: ${altPath}`);
      console.error(`\n   Please create a JSON file with the fighters list.`);
      console.error(`   The file should contain an array of objects with: url, name, id, color`);
      process.exit(1);
    }
  }
}

async function runZona200Scraper() {
  console.log('🚀 Starting Zona 200 Foreigners Scraper...\n');
  
  const startTime = Date.now();
  
  try {
    // Load the fighters list
    const fighters = await loadFightersList();
    
    if (fighters.length === 0) {
      console.error('❌ No fighters to scrape!');
      process.exit(1);
    }
    
    console.log(`📊 Found ${fighters.length} fighters to scrape\n`);
    
    // Create scraper
    const scraper = createZona200Scraper({
      delayBetweenRequests: 1500, // Be respectful to their API
      maxRetries: 3,
      enableCaching: true
    });
    
    // Scrape all fighters
    const records = await scraper.scrapeFighters(fighters);
    
    // Save the data with custom filename
    const savedPath = await scraper.saveToFile(records, 'russian_foreign_fighters.json');
    
    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\n✅ Scraping completed successfully!`);
    console.log(`⏱️  Total time: ${(totalTime / 60).toFixed(1)} minutes`);
    console.log(`📊 Total records: ${records.length.toLocaleString()}`);
    console.log(`💾 Data saved: ${savedPath}`);
    
    // Generate summary
    const regions = new Map<string, number>();
    const types = new Map<string, number>();
    
    records.forEach(record => {
      const region = record.regionDisplay || record.region || 'Unknown';
      const type = record.type || 'Unknown';
      
      regions.set(region, (regions.get(region) || 0) + 1);
      types.set(type, (types.get(type) || 0) + 1);
    });
    
    console.log(`\n📊 Summary by Region:`);
    Array.from(regions.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([region, count]) => {
        console.log(`   ${region}: ${count}`);
      });
    
    console.log(`\n📊 Summary by Type:`);
    Array.from(types.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    
  } catch (error) {
    console.error('❌ Error during scraping:', error);
    process.exit(1);
  }
}

// Run the scraper
runZona200Scraper().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

