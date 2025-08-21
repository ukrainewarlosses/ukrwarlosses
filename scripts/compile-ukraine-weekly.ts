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

// Helper function to get week start date
function getWeekStartDate(date: Date): Date {
  const dayOfWeek = date.getDay();
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(date.getFullYear(), date.getMonth(), diff);
}

async function main() {
  const inputArg = process.argv.find(a => a.startsWith('--input='));
  // Use the new Lost Armour raw data
  const inputPath = inputArg ? inputArg.split('=')[1] : path.join(process.cwd(), 'src', 'data', 'ukraine', 'soldiers-raw.json');
  
  console.log(`📊 Compiling Ukraine weekly data from RAW Lost Armour records: ${inputPath}`);
  
  const raw = await fs.readFile(inputPath, 'utf-8');
  const records: UkraineLostArmourRecord[] = JSON.parse(raw);
  
  console.log(`📊 Raw records loaded: ${records.length.toLocaleString()}`);
  
  // Analyze by record type
  const deathRecords = records.filter(r => r.recordType === 'death');
  const missingRecords = records.filter(r => r.recordType === 'missing');
  
  console.log(`   Deaths: ${deathRecords.length.toLocaleString()}`);
  console.log(`   Missing: ${missingRecords.length.toLocaleString()}`);
  
  const warStart = new Date('2022-02-01T00:00:00Z');
  // Stop at current month minus one (e.g., if current month is August, stop at July)
  const now = new Date();
  const cutoffMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Previous month
  
  const weeklyData: Record<string, UkraineWeeklyData> = {};

  let processedCount = 0;
  let skippedCount = 0;
  
  for (const record of records) {
    // Determine the event date based on record type
    let eventDateStr: string;
    let isDeathRecord = false;
    
    if (record.recordType === 'death' && record.deathDate) {
      eventDateStr = record.deathDate;
      isDeathRecord = true;
    } else if (record.recordType === 'missing' && record.missingDate) {
      eventDateStr = record.missingDate;
      isDeathRecord = false;
    } else {
      // Skip records without proper dates
      skippedCount++;
      continue;
    }
    
    const eventDate = new Date(eventDateStr);
    
    // Skip invalid dates or dates before war start
    if (isNaN(eventDate.getTime()) || eventDate < warStart) {
      skippedCount++;
      continue;
    }
    
    // Skip future dates beyond cutoff
    const recordMonth = new Date(eventDate.getFullYear(), eventDate.getMonth(), 1);
    if (recordMonth > cutoffMonth) {
      skippedCount++;
      continue;
    }
    
    // Create week key
    const weekKey = getWeekKey(eventDate);
    
    // Initialize week data if not exists
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { deaths: 0, missing: 0, total: 0 };
    }
    
    // Increment appropriate counter based on record type
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

  // Sort by week key and create final output
  const sortedKeys = Object.keys(weeklyData).sort();
  const sortedWeeklyData: Record<string, UkraineWeeklyData> = {};
  for (const key of sortedKeys) {
    sortedWeeklyData[key] = weeklyData[key];
  }

  // Save the compiled weekly data as raw summary
  const outputPath = path.join(process.cwd(), 'src', 'data', 'ukraine', `weekly-raw_${new Date().toISOString().split('T')[0]}.json`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(sortedWeeklyData, null, 2), 'utf-8');
  
  console.log(`✅ Ukraine weekly data compiled: ${outputPath}`);
  console.log(`📈 Total weeks: ${sortedKeys.length}`);
  console.log(`📅 Date range: ${sortedKeys[0]} to ${sortedKeys[sortedKeys.length - 1]}`);
  
  // Show sample data
  const sampleEntries = Object.entries(sortedWeeklyData).slice(-3);
  console.log('📊 Last 3 weeks sample:');
  for (const [week, data] of sampleEntries) {
    console.log(`  ${week}: ${data.total} total (${data.deaths} deaths, ${data.missing} missing)`);
  }
}

main().catch(err => {
  console.error('❌ Error compiling Ukraine weekly data:', err);
  process.exit(1);
});
