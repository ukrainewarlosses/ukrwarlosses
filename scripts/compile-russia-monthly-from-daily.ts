import fs from 'fs/promises';
import path from 'path';

interface RussiaDailyData {
  deaths: number;
  total: number;
}

interface RussiaMonthlyData {
  deaths: number;
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
  console.log(`📊 Compiling Russia monthly data from DAILY compiled data`);
  
  // Find the most recent daily file
  const dataDir = path.join(process.cwd(), 'src', 'data', 'russia');
  const allFiles = await fs.readdir(dataDir);
  const dailyFiles = allFiles.filter(f => f.startsWith('daily_') && f.endsWith('.json'));
  
  if (dailyFiles.length === 0) {
    throw new Error('No daily files found. Please run compile-russia-daily first.');
  }
  
  // Sort by date and get the most recent
  const sortedFiles = dailyFiles.sort().reverse();
  const latestFile = sortedFiles[0];
  const inputPath = path.join(dataDir, latestFile);
  
  console.log(`📖 Reading from: ${latestFile}`);
  
  const raw = await fs.readFile(inputPath, 'utf-8');
  const dailyData: Record<string, RussiaDailyData> = JSON.parse(raw);
  
  console.log(`📊 Daily records loaded: ${Object.keys(dailyData).length.toLocaleString()} days`);
  
  const monthlyData: Record<string, RussiaMonthlyData> = {};
  
  // Aggregate daily data into months
  for (const [dayKey, dayData] of Object.entries(dailyData)) {
    const monthKey = getMonthKey(dayKey);
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { deaths: 0, total: 0 };
    }
    
    monthlyData[monthKey].deaths += dayData.deaths;
    monthlyData[monthKey].total += dayData.total;
  }
  
  // Sort by month key
  const sortedKeys = Object.keys(monthlyData).sort();
  const sortedMonthlyData: Record<string, RussiaMonthlyData> = {};
  for (const key of sortedKeys) {
    sortedMonthlyData[key] = monthlyData[key];
  }
  
  // Save the compiled monthly data
  const timestamp = new Date().toISOString().split('T')[0];
  const outputPath = path.join(dataDir, `monthly_${timestamp}.json`);
  await fs.writeFile(outputPath, JSON.stringify(sortedMonthlyData, null, 2), 'utf-8');
  
  console.log(`✅ Russia monthly data compiled: ${outputPath}`);
  console.log(`📈 Total months: ${sortedKeys.length}`);
  console.log(`📅 Month range: ${sortedKeys[0]} to ${sortedKeys[sortedKeys.length - 1]}`);
  
  // Show sample data
  const sampleEntries = Object.entries(sortedMonthlyData).slice(-3);
  console.log('📊 Last 3 months sample:');
  for (const [month, data] of sampleEntries) {
    console.log(`  ${month}: ${data.total} total deaths`);
  }
}

main().catch(err => {
  console.error('❌ Error compiling Russia monthly data:', err);
  process.exit(1);
});

