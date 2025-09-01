import fs from 'fs/promises';
import path from 'path';

interface RussianCasualtyRecord {
  date: string;
  fullName: string;
  confirmationLink: string;
  year?: number;
}

interface RussiaDailyData {
  deaths: number; // Russian data only tracks deaths/casualties
  total: number;  // Same as deaths for Russia
}

async function main() {
  const inputArg = process.argv.find(a => a.startsWith('--input='));
  
  const inputPath = inputArg ? inputArg.split('=')[1] : path.join(process.cwd(), 'src', 'data', 'russia', 'casualties.json');
  
  console.log(`📊 Compiling Russia daily data from: ${inputPath}`);
  
  try {
    const raw = await fs.readFile(inputPath, 'utf-8');
    const records: RussianCasualtyRecord[] = JSON.parse(raw);
    
    if (!Array.isArray(records)) {
      throw new Error('Expected an array of casualty records from zona.media data');
    }
    
    const warStart = new Date('2022-02-24T00:00:00Z'); // Russia invasion start
    // Stop at current date minus one (e.g., if current date is August 21, stop at August 20)
    const now = new Date();
    const cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1); // Previous day
    
    const dailyData: Record<string, RussiaDailyData> = {};

    let processedCount = 0;
    let skippedCount = 0;

    for (const record of records) {
      if (!record.date || !record.fullName) {
        skippedCount++;
        continue;
      }
      
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
      
      if (!eventDate || isNaN(eventDate.getTime()) || eventDate < warStart) {
        skippedCount++;
        continue;
      }
      
      // Skip if the date is beyond cutoff
      if (eventDate > cutoffDate) {
        skippedCount++;
        continue;
      }
      
      // Create day key (YYYY-MM-DD format)
      const dayKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
      
      if (!dailyData[dayKey]) {
        dailyData[dayKey] = { deaths: 0, total: 0 };
      }
      
      // Each record represents one death
      dailyData[dayKey].deaths += 1;
      dailyData[dayKey].total += 1;
      processedCount++;
    }

    console.log(`\n📊 Processing results:`);
    console.log(`   Processed: ${processedCount.toLocaleString()}`);
    console.log(`   Skipped: ${skippedCount.toLocaleString()}`);

    // Sort by day key and create final output
    const sortedKeys = Object.keys(dailyData).sort();
    const sortedDailyData: Record<string, RussiaDailyData> = {};
    for (const key of sortedKeys) {
      sortedDailyData[key] = dailyData[key];
    }

    // Save the compiled daily data
    const outputPath = path.join(process.cwd(), 'src', 'data', 'russia', `daily_${new Date().toISOString().split('T')[0]}.json`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(sortedDailyData, null, 2), 'utf-8');
    
    console.log(`✅ Russia daily data compiled: ${outputPath}`);
    console.log(`📈 Total days: ${sortedKeys.length}`);
    console.log(`📅 Date range: ${sortedKeys[0]} to ${sortedKeys[sortedKeys.length - 1]}`);
    
    // Show sample data
    const sampleEntries = Object.entries(sortedDailyData).slice(-5);
    console.log('📊 Last 5 days sample:');
    for (const [day, data] of sampleEntries) {
      console.log(`  ${day}: ${data.total} total deaths`);
    }
    
  } catch (error) {
    if (error instanceof Error && (error as any).code === 'ENOENT') {
      console.error(`❌ Input file not found: ${inputPath}`);
      console.error('💡 Make sure to run the Russian scraper first to generate the data file.');
    } else {
      console.error('❌ Error compiling Russia daily data:', error);
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
