import fs from 'fs/promises';
import path from 'path';

interface RussianCasualtyRecord {
  date: string;
  fullName: string;
  confirmationLink: string;
  year?: number;
}

interface RussiaMonthlyData {
  deaths: number; // Russian data only tracks deaths/casualties
  total: number;  // Same as deaths for Russia
}

async function main() {
  const inputArg = process.argv.find(a => a.startsWith('--input='));
  
  const inputPath = inputArg ? inputArg.split('=')[1] : path.join(process.cwd(), 'src', 'data', 'russia', 'casualties.json');
  
  console.log(`📊 Compiling Russia monthly data from: ${inputPath}`);
  
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
    
    const monthlyData: Record<string, RussiaMonthlyData> = {};

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
      
      const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { deaths: 0, total: 0 };
      }
      
      // Each record represents one death
      monthlyData[monthKey].deaths += 1;
      monthlyData[monthKey].total += 1;
    }

    // Sort by month key and create final output
    const sortedKeys = Object.keys(monthlyData).sort();
    const sortedMonthlyData: Record<string, RussiaMonthlyData> = {};
    for (const key of sortedKeys) {
      sortedMonthlyData[key] = monthlyData[key];
    }

    // Save the compiled monthly data
    const outputPath = path.join(process.cwd(), 'src', 'data', 'russia', `monthly_${new Date().toISOString().split('T')[0]}.json`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(sortedMonthlyData, null, 2), 'utf-8');
    
    console.log(`✅ Russia monthly data compiled: ${outputPath}`);
    console.log(`📈 Total months: ${sortedKeys.length}`);
    console.log(`📅 Date range: ${sortedKeys[0]} to ${sortedKeys[sortedKeys.length - 1]}`);
    
    // Show sample data
    const sampleEntries = Object.entries(sortedMonthlyData).slice(-3);
    console.log('📊 Last 3 months sample:');
    for (const [month, data] of sampleEntries) {
      console.log(`  ${month}: ${data.total} total deaths`);
    }
    
  } catch (error) {
    if (error instanceof Error && (error as any).code === 'ENOENT') {
      console.error(`❌ Input file not found: ${inputPath}`);
      console.error('💡 Make sure to run the Russian scraper first to generate the data file.');
    } else {
      console.error('❌ Error compiling Russia monthly data:', error);
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
