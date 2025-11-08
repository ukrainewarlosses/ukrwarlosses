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
  recordType: 'death' | 'missing';
  estimatedDeathDate?: string;
}

interface UkraineDailyData {
  deaths: number;
  missing: number;
  total: number;
}

async function main() {
  const inputArg = process.argv.find(a => a.startsWith('--input='));
  // Use the new Lost Armour raw data
  const inputPath = inputArg ? inputArg.split('=')[1] : path.join(process.cwd(), 'src', 'data', 'ukraine', 'soldiers-raw.json');
  
  console.log(`📊 Compiling Ukraine daily data from RAW Lost Armour records: ${inputPath}`);
  
  const raw = await fs.readFile(inputPath, 'utf-8');
  const records: UkraineLostArmourRecord[] = JSON.parse(raw);
  
  console.log(`📊 Raw records loaded: ${records.length.toLocaleString()}`);
  
  // Analyze by record type
  const deathRecords = records.filter(r => r.recordType === 'death');
  const missingRecords = records.filter(r => r.recordType === 'missing');
  
  console.log(`   Deaths: ${deathRecords.length.toLocaleString()}`);
  console.log(`   Missing: ${missingRecords.length.toLocaleString()}`);
  
  const warStart = new Date('2022-02-01T00:00:00Z');
  // Cutoff: Last day of previous month (consistent with monthly/weekly)
  const now = new Date();
  const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfPreviousMonth = new Date(firstDayOfCurrentMonth.getTime() - 1);
  const cutoffDate = lastDayOfPreviousMonth;
  
  const dailyData: Record<string, UkraineDailyData> = {};

  let processedCount = 0;
  let skippedCount = 0;
  
  for (const record of records) {
    // Determine the event date based on record type
    let eventDateStr: string;
    let isDeathRecord = false;
    
    // Use the EXACT same logic as monthly compilation for consistency
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
    
    // Skip future dates beyond cutoff
    if (eventDate > cutoffDate) {
      skippedCount++;
      continue;
    }
    
    // Create day key (YYYY-MM-DD format)
    const dayKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
    
    // Initialize day data if not exists
    if (!dailyData[dayKey]) {
      dailyData[dayKey] = { deaths: 0, missing: 0, total: 0 };
    }
    
    // Increment appropriate counter based on record type
    if (isDeathRecord) {
      dailyData[dayKey].deaths += 1;
    } else {
      dailyData[dayKey].missing += 1;
    }
    
    dailyData[dayKey].total += 1;
    processedCount++;
  }
  
  console.log(`\n📊 Processing results:`);
  console.log(`   Processed: ${processedCount.toLocaleString()}`);
  console.log(`   Skipped: ${skippedCount.toLocaleString()}`);

  // Sort by day key and create final output
  const sortedKeys = Object.keys(dailyData).sort();
  const sortedDailyData: Record<string, UkraineDailyData> = {};
  for (const key of sortedKeys) {
    sortedDailyData[key] = dailyData[key];
  }

  // Save the compiled daily data (use "deduplicated" if input is soldiers.json, otherwise "raw")
  const isDeduped = inputPath.includes('soldiers.json');
  const prefix = isDeduped ? 'daily-deduplicated' : 'daily-raw';
  const outputPath = path.join(process.cwd(), 'src', 'data', 'ukraine', `${prefix}_${new Date().toISOString().split('T')[0]}.json`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(sortedDailyData, null, 2), 'utf-8');
  
  console.log(`✅ Ukraine daily data compiled: ${outputPath}`);
  console.log(`📈 Total days: ${sortedKeys.length}`);
  console.log(`📅 Date range: ${sortedKeys[0]} to ${sortedKeys[sortedKeys.length - 1]}`);
  
  // Show sample data
  const sampleEntries = Object.entries(sortedDailyData).slice(-5);
  console.log('📊 Last 5 days sample:');
  for (const [day, data] of sampleEntries) {
    console.log(`  ${day}: ${data.total} total (${data.deaths} deaths, ${data.missing} missing)`);
  }
}

main().catch(err => {
  console.error('❌ Error compiling Ukraine daily data:', err);
  process.exit(1);
});
