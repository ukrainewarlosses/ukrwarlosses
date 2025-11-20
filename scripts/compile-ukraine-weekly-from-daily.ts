import fs from 'fs/promises';
import path from 'path';

interface UkraineDailyData {
  deaths: number;
  missing: number;
  total: number;
}

interface UkraineWeeklyData {
  deaths: number;
  missing: number;
  total: number;
}

// Helper function to get week key (YYYY-WNN format)
function getWeekKey(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

async function main() {
  console.log(`📊 Compiling Ukraine weekly data from DAILY compiled data`);
  
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
  
  const weeklyData: Record<string, UkraineWeeklyData> = {};
  
  // Aggregate daily data into weeks
  for (const [dayKey, dayData] of Object.entries(dailyData)) {
    const weekKey = getWeekKey(dayKey);
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { deaths: 0, missing: 0, total: 0 };
    }
    
    weeklyData[weekKey].deaths += dayData.deaths;
    weeklyData[weekKey].missing += dayData.missing;
    weeklyData[weekKey].total += dayData.total;
  }
  
  // Sort by week key
  const sortedKeys = Object.keys(weeklyData).sort();
  const sortedWeeklyData: Record<string, UkraineWeeklyData> = {};
  for (const key of sortedKeys) {
    sortedWeeklyData[key] = weeklyData[key];
  }
  
  // Save the compiled weekly data
  const timestamp = new Date().toISOString().split('T')[0];
  const outputPath = path.join(dataDir, `weekly-deduplicated_${timestamp}.json`);
  await fs.writeFile(outputPath, JSON.stringify(sortedWeeklyData, null, 2), 'utf-8');
  
  console.log(`✅ Ukraine weekly data compiled: ${outputPath}`);
  console.log(`📈 Total weeks: ${sortedKeys.length}`);
  console.log(`📅 Week range: ${sortedKeys[0]} to ${sortedKeys[sortedKeys.length - 1]}`);
  
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

