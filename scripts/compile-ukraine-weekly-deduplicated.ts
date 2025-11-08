#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

interface UkraineLostArmourRecord {
  name: string;
  birthDate: string;
  deathDate: string;
  missingDate: string;
  location: string;
  rawText: string;
  pageSource: string;
  detailUrl: string;
  // Additional fields from Lost Armour
  rank?: string;
  age?: string;
  conscription?: string;
  sources?: string;
  recordType?: 'death' | 'missing';
  estimatedDeathDate?: string;
}

interface UkraineWeeklyData {
  deaths: number;
  missing: number;
  total: number;
}

// Helper function to get week number and year
function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

async function compileUkrainianWeeklyDeduplicated() {
  console.log('📊 Compiling Ukrainian weekly data from DEDUPLICATED Lost Armour records...\n');
  
  try {
    const inputPath = path.join(process.cwd(), 'src', 'data', 'ukraine', 'soldiers.json');
    
    console.log(`📖 Reading deduplicated data from: ${inputPath}`);
    
    // Check if deduplicated data exists
    try {
      await fs.access(inputPath);
    } catch (error) {
      console.error(`❌ Deduplicated data file not found: ${inputPath}`);
      console.error('   Make sure to run deduplication first');
      process.exit(1);
    }
    
    const raw = await fs.readFile(inputPath, 'utf-8');
    const records: UkraineLostArmourRecord[] = JSON.parse(raw);
    
    console.log(`📊 Deduplicated records loaded: ${records.length.toLocaleString()}`);
    
    // Analyze by record type (infer from dates if recordType not present)
    const deathRecords = records.filter(r => r.recordType === 'death' || (r.deathDate && r.deathDate !== ''));
    const missingRecords = records.filter(r => r.recordType === 'missing' || (r.missingDate && r.missingDate !== '' && (!r.deathDate || r.deathDate === '')));
    
    console.log(`   Deaths: ${deathRecords.length.toLocaleString()}`);
    console.log(`   Missing: ${missingRecords.length.toLocaleString()}`);
    
    // Define war start and cutoff
    const warStart = new Date('2022-02-01T00:00:00Z');
    // Cutoff: Last day of previous month
    const now = new Date();
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfPreviousMonth = new Date(firstDayOfCurrentMonth.getTime() - 1);
    const cutoffDate = lastDayOfPreviousMonth;
    const cutoffMonth = new Date(lastDayOfPreviousMonth.getFullYear(), lastDayOfPreviousMonth.getMonth(), 1);
    
    console.log(`📅 Date range: ${warStart.toISOString().split('T')[0]} to ${cutoffMonth.toISOString().split('T')[0]}`);
    
    const weeklyData: Record<string, UkraineWeeklyData> = {};
    
    // Process records
    let processedCount = 0;
    let skippedCount = 0;
    
    for (const record of records) {
      // Determine the event date based on record type
      let eventDateStr: string;
      let isDeathRecord = false;
      
      // Infer record type from dates if recordType not present
      if ((record.recordType === 'death' || !record.recordType) && record.deathDate && record.deathDate !== '') {
        eventDateStr = record.deathDate;
        isDeathRecord = true;
      } else if ((record.recordType === 'missing' || !record.recordType) && record.missingDate && record.missingDate !== '') {
        eventDateStr = record.missingDate;
        isDeathRecord = false;
      } else {
        // Skip records without proper dates
        skippedCount++;
        continue;
      }
      
      // Clean up malformed dates (e.g., "2022)-12-(09" -> "2022-12-09")
      const cleanedDateStr = eventDateStr.replace(/\)/g, '').replace(/\(/g, '-').replace(/--+/g, '-');
      const eventDate = new Date(cleanedDateStr);
      
      // Skip invalid dates or dates before war start
      if (isNaN(eventDate.getTime()) || eventDate < warStart) {
        skippedCount++;
        continue;
      }
      
      // Skip future dates beyond cutoff (last day of previous month)
      if (eventDate > cutoffDate) {
        skippedCount++;
        continue;
      }
      
      // Create week key
      const weekKey = getWeekKey(eventDate);
      
      // Initialize week data if not exists
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { deaths: 0, missing: 0, total: 0 };
      }
      
      // Increment appropriate counter
      if (isDeathRecord) {
        weeklyData[weekKey].deaths += 1;
      } else {
        weeklyData[weekKey].missing += 1;
      }
      
      weeklyData[weekKey].total += 1;
      processedCount++;
    }
    
    console.log(`\n📊 Processing results:`);
    console.log(`   Processed: ${processedCount.toLocaleString()}`);
    console.log(`   Skipped: ${skippedCount.toLocaleString()}`);
    
    // Sort by week
    const sortedKeys = Object.keys(weeklyData).sort();
    const sortedWeeklyData: Record<string, UkraineWeeklyData> = {};
    for (const key of sortedKeys) {
      sortedWeeklyData[key] = weeklyData[key];
    }
    
    // Save compiled data
    const timestamp = new Date().toISOString().split('T')[0];
    const outputPath = path.join(process.cwd(), 'src', 'data', 'ukraine', `weekly-deduplicated_${timestamp}.json`);
    
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(sortedWeeklyData, null, 2), 'utf-8');
    
    console.log(`\n✅ Ukrainian deduplicated weekly data compiled: ${outputPath}`);
    console.log(`📈 Total weeks: ${sortedKeys.length}`);
    
    if (sortedKeys.length > 0) {
      console.log(`📅 Date range: ${sortedKeys[0]} to ${sortedKeys[sortedKeys.length - 1]}`);
    }
    
    // Show sample of recent weeks
    const sampleEntries = Object.entries(sortedWeeklyData).slice(-5);
    console.log('\n📊 Last 5 weeks sample:');
    for (const [week, data] of sampleEntries) {
      console.log(`   ${week}: ${data.total.toLocaleString()} total (${data.deaths.toLocaleString()} deaths, ${data.missing.toLocaleString()} missing)`);
    }
    
    // Calculate totals
    const totalDeaths = Object.values(sortedWeeklyData).reduce((sum, data) => sum + data.deaths, 0);
    const totalMissing = Object.values(sortedWeeklyData).reduce((sum, data) => sum + data.missing, 0);
    const grandTotal = totalDeaths + totalMissing;
    
    console.log(`\n📊 Grand totals:`);
    console.log(`   Deaths: ${totalDeaths.toLocaleString()}`);
    console.log(`   Missing: ${totalMissing.toLocaleString()}`);
    console.log(`   Total: ${grandTotal.toLocaleString()}`);
    
    console.log('\n✅ Ukrainian deduplicated weekly compilation completed successfully!');
    
  } catch (error) {
    console.error('❌ Deduplicated weekly compilation failed:', error);
    process.exit(1);
  }
}

compileUkrainianWeeklyDeduplicated();
