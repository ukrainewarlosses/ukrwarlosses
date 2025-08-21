import fs from 'fs/promises';
import path from 'path';

interface RussianCasualtyRecord {
  date: string;
  fullName: string;
  confirmationLink: string;
  year?: number;
}

interface RussiaWeeklyData {
  deaths: number; // Russian data only tracks deaths/casualties
  total: number;  // Same as deaths for Russia
}

// Helper function to get week number and year
function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

async function main() {
  const inputArg = process.argv.find(a => a.startsWith('--input='));
  
  const inputPath = inputArg ? inputArg.split('=')[1] : path.join(process.cwd(), 'src', 'data', 'russia', 'casualties.json');
  
  console.log(`📊 Compiling Russia weekly data from: ${inputPath}`);
  
  try {
    const raw = await fs.readFile(inputPath, 'utf-8');
    const records: RussianCasualtyRecord[] = JSON.parse(raw);
    
    if (!Array.isArray(records)) {
      throw new Error('Expected an array of casualty records from zona.media data');
    }
    
    const warStart = new Date('2022-02-24T00:00:00Z'); // Russia invasion start
    // Stop at current month minus one (e.g., if current month is August, stop at July)
    const now = new Date();
    const cutoffMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Previous month
    
    const weeklyData: Record<string, RussiaWeeklyData> = {};

    for (const record of records) {
      if (!record.date || !record.fullName) continue;
      
      // Try to parse date in various formats (DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.)
      let eventDate: Date | null = null;
      
      // Try DD.MM.YYYY format
      const ddmmyyyyMatch = record.date.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      
      // Try DD/MM/YYYY format
      if (!eventDate) {
        const ddmmyyyySlashMatch = record.date.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (ddmmyyyySlashMatch) {
          const [, day, month, year] = ddmmyyyySlashMatch;
          eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }
      
      // Try YYYY-MM-DD format
      if (!eventDate) {
        const yyyymmddMatch = record.date.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (yyyymmddMatch) {
          const [, year, month, day] = yyyymmddMatch;
          eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }
      
      // If we have a year field, try to extract month/day from date string
      if (!eventDate && record.year) {
        // Look for month and day patterns in the date string
        const monthDayMatch = record.date.match(/(\d{1,2})\.(\d{1,2})/);
        if (monthDayMatch) {
          const [, day, month] = monthDayMatch;
          eventDate = new Date(record.year, parseInt(month) - 1, parseInt(day));
        }
      }
      
      if (!eventDate || isNaN(eventDate.getTime()) || eventDate < warStart) continue;
      
      // Skip if the date is in current month or future months
      const recordMonth = new Date(eventDate.getFullYear(), eventDate.getMonth(), 1);
      if (recordMonth > cutoffMonth) continue;
      
      const weekKey = getWeekKey(eventDate);
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { deaths: 0, total: 0 };
      }
      
      // Each record represents one death
      weeklyData[weekKey].deaths += 1;
      weeklyData[weekKey].total += 1;
    }

    // Sort by week key and create final output
    const sortedKeys = Object.keys(weeklyData).sort();
    const sortedWeeklyData: Record<string, RussiaWeeklyData> = {};
    for (const key of sortedKeys) {
      sortedWeeklyData[key] = weeklyData[key];
    }

    // Save the compiled weekly data
    const outputPath = path.join(process.cwd(), 'src', 'data', 'russia', `weekly_${new Date().toISOString().split('T')[0]}.json`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(sortedWeeklyData, null, 2), 'utf-8');
    
    console.log(`✅ Russia weekly data compiled: ${outputPath}`);
    console.log(`📈 Total weeks: ${sortedKeys.length}`);
    console.log(`📅 Date range: ${sortedKeys[0]} to ${sortedKeys[sortedKeys.length - 1]}`);
    
    // Show sample data
    const sampleEntries = Object.entries(sortedWeeklyData).slice(-3);
    console.log('📊 Last 3 weeks sample:');
    for (const [week, data] of sampleEntries) {
      console.log(`  ${week}: ${data.total} total deaths`);
    }
    
  } catch (error) {
    if (error instanceof Error && (error as any).code === 'ENOENT') {
      console.error(`❌ Input file not found: ${inputPath}`);
      console.error('💡 Make sure to run the Russian scraper first to generate the data file.');
    } else {
      console.error('❌ Error compiling Russia weekly data:', error);
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
