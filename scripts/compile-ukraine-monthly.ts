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

interface UkraineMonthlyData {
  deaths: number;
  missing: number;
  total: number;
}

async function main() {
  const inputArg = process.argv.find(a => a.startsWith('--input='));
  // Use the new Lost Armour raw data
  const inputPath = inputArg ? inputArg.split('=')[1] : path.join(process.cwd(), 'src', 'data', 'ukraine', 'soldiers-raw.json');
  
  console.log(`📊 Compiling Ukraine monthly data from RAW Lost Armour records: ${inputPath}`);
  
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
  
  const monthlyData: Record<string, UkraineMonthlyData> = {};

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
    
    // Clean up malformed dates (e.g., "2022)-12-(09" -> "2022-12-09")
    const cleanedDateStr = eventDateStr.replace(/\)/g, '').replace(/\(/g, '-').replace(/--+/g, '-');
    const eventDate = new Date(cleanedDateStr);
    
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
    
    // Create month key
    const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Initialize month data if not exists
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { deaths: 0, missing: 0, total: 0 };
    }
    
    // Increment appropriate counter based on record type
    if (isDeathRecord) {
      monthlyData[monthKey].deaths += 1;
    } else {
      monthlyData[monthKey].missing += 1;
    }
    
    monthlyData[monthKey].total += 1;
    processedCount++;
  }
  
  console.log(`\n📊 Processing results:`);
  console.log(`   Processed: ${processedCount.toLocaleString()}`);
  console.log(`   Skipped: ${skippedCount.toLocaleString()}`);

  // Sort by month key and create final output
  const sortedKeys = Object.keys(monthlyData).sort();
  const sortedMonthlyData: Record<string, UkraineMonthlyData> = {};
  for (const key of sortedKeys) {
    sortedMonthlyData[key] = monthlyData[key];
  }

  // Save the compiled monthly data as raw summary
  const outputPath = path.join(process.cwd(), 'src', 'data', 'ukraine', `monthly-raw_${new Date().toISOString().split('T')[0]}.json`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(sortedMonthlyData, null, 2), 'utf-8');
  
  console.log(`✅ Ukraine monthly data compiled: ${outputPath}`);
  console.log(`📈 Total months: ${sortedKeys.length}`);
  console.log(`📅 Date range: ${sortedKeys[0]} to ${sortedKeys[sortedKeys.length - 1]}`);
  
  // Show sample data
  const sampleEntries = Object.entries(sortedMonthlyData).slice(-3);
  console.log('📊 Last 3 months sample:');
  for (const [month, data] of sampleEntries) {
    console.log(`  ${month}: ${data.total} total (${data.deaths} deaths, ${data.missing} missing)`);
  }
}

main().catch(err => {
  console.error('❌ Error compiling Ukraine monthly data:', err);
  process.exit(1);
});
