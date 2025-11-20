import fs from 'fs/promises';
import path from 'path';

interface UkraineDailyData {
  deaths: number;
  missing: number;
  total: number;
}

interface UkraineMonthlyData {
  deaths: number;
  missing: number;
  total: number;
}

// Helper function to get month key (YYYY-MM format)
function getMonthKey(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

async function main() {
  console.log(`📊 Compiling Ukraine monthly data from DAILY compiled data`);
  
  // Find the most recent daily-deduplicated file
  const dataDir = path.join(process.cwd(), 'src', 'data', 'ukraine');
  const allFiles = await fs.readdir(dataDir);
  const dailyFiles = allFiles.filter(f => f.startsWith('daily-deduplicated_') && f.endsWith('.json'));
  
  if (dailyFiles.length === 0) {
    throw new Error('No daily-deduplicated files found. Please run compile-ukraine-daily first.');
  }
  
  // Sort by date and get the most recent
  const sortedFiles = dailyFiles.sort().reverse();
  const latestFile = sortedFiles[0];
  const inputPath = path.join(dataDir, latestFile);
  
  console.log(`📖 Reading from: ${latestFile}`);
  
  const raw = await fs.readFile(inputPath, 'utf-8');
  const dailyData: Record<string, UkraineDailyData> = JSON.parse(raw);
  
  console.log(`📊 Daily records loaded: ${Object.keys(dailyData).length.toLocaleString()} days`);
  
  const monthlyData: Record<string, UkraineMonthlyData> = {};
  
  // Aggregate daily data into months
  for (const [dayKey, dayData] of Object.entries(dailyData)) {
    const monthKey = getMonthKey(dayKey);
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { deaths: 0, missing: 0, total: 0 };
    }
    
    monthlyData[monthKey].deaths += dayData.deaths;
    monthlyData[monthKey].missing += dayData.missing;
    monthlyData[monthKey].total += dayData.total;
  }
  
  // Sort by month key
  const sortedKeys = Object.keys(monthlyData).sort();
  const sortedMonthlyData: Record<string, UkraineMonthlyData> = {};
  for (const key of sortedKeys) {
    sortedMonthlyData[key] = monthlyData[key];
  }
  
  // Save the compiled monthly data
  const timestamp = new Date().toISOString().split('T')[0];
  const outputPath = path.join(dataDir, `monthly-deduplicated_${timestamp}.json`);
  await fs.writeFile(outputPath, JSON.stringify(sortedMonthlyData, null, 2), 'utf-8');
  
  console.log(`✅ Ukraine monthly data compiled: ${outputPath}`);
  console.log(`📈 Total months: ${sortedKeys.length}`);
  console.log(`📅 Month range: ${sortedKeys[0]} to ${sortedKeys[sortedKeys.length - 1]}`);
  
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

