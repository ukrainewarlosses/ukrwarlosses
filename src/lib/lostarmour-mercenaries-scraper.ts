import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';

export interface LostArmourMercenaryRecord {
  number: number;
  name: string;
  citizenship: string;
  placeAndCause: string;
  dateOfDeath: string;
  note: string;
  link: string;
}

export interface LostArmourMercenariesScraperConfig {
  delayBetweenRequests?: number;
  maxRetries?: number;
  enableCaching?: boolean;
}

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://lostarmour.info/'
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, maxRetries: number): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      console.log(`  Fetching: ${url} (attempt ${attempt})`);
      
      const response = await fetch(url, {
        headers: DEFAULT_HEADERS,
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      console.log(`  ✅ Success: ${html.length} bytes`);
      return html;
      
    } catch (error) {
      lastError = error as Error;
      console.log(`  ❌ Attempt ${attempt} failed:`, error);
      
      if (attempt <= maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        console.log(`  ⏳ Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

function parseMercenariesTable(html: string): LostArmourMercenaryRecord[] {
  const $ = cheerio.load(html);
  const records: LostArmourMercenaryRecord[] = [];
  
  // Find the table with mercenaries data
  // The table should have columns: #, Имя, Гражданство, Место и причина гибели, Дата гибели, Примечание, Линк
  const table = $('table').first();
  
  if (table.length === 0) {
    console.log('  ⚠️  No table found in HTML');
    return records;
  }
  
  // Find all rows (skip header row)
  const rows = table.find('tr').slice(1); // Skip first row (header)
  
  console.log(`  📊 Found ${rows.length} table rows`);
  
  rows.each((index, row) => {
    const cells = $(row).find('td');
    
    if (cells.length >= 7) {
      // Extract data from each cell
      const number = parseInt($(cells[0]).text().trim(), 10) || index + 1;
      const name = $(cells[1]).text().trim();
      const citizenship = $(cells[2]).text().trim();
      const placeAndCause = $(cells[3]).text().trim();
      const dateOfDeath = $(cells[4]).text().trim();
      const note = $(cells[5]).text().trim();
      
      // Extract link from the last cell
      const linkElement = $(cells[6]).find('a').first();
      const link = linkElement.attr('href') || linkElement.text().trim() || '';
      
      if (name) {
        records.push({
          number,
          name,
          citizenship,
          placeAndCause,
          dateOfDeath,
          note,
          link
        });
      }
    }
  });
  
  return records;
}

export class LostArmourMercenariesScraper {
  private config: Required<LostArmourMercenariesScraperConfig>;
  
  constructor(config: LostArmourMercenariesScraperConfig = {}) {
    this.config = {
      delayBetweenRequests: config.delayBetweenRequests || 2000,
      maxRetries: config.maxRetries || 3,
      enableCaching: config.enableCaching ?? true
    };
  }
  
  async scrapeMercenaries(): Promise<LostArmourMercenaryRecord[]> {
    console.log('🚀 Starting Lost Armour Mercenaries scraping...');
    console.log('📋 Source: https://lostarmour.info/mercenaries');
    console.log(`⏱️  Delay between requests: ${this.config.delayBetweenRequests}ms`);
    
    try {
      const url = 'https://lostarmour.info/mercenaries';
      const html = await fetchWithRetry(url, this.config.maxRetries);
      
      const records = parseMercenariesTable(html);
      
      console.log(`✅ Scraping completed: ${records.length} mercenaries found`);
      return records;
      
    } catch (error) {
      console.error('❌ Error scraping mercenaries:', error);
      throw error;
    }
  }
  
  async saveToFile(
    records: LostArmourMercenaryRecord[],
    filename?: string
  ): Promise<string> {
    if (!this.config.enableCaching) {
      console.log('💾 Caching disabled, skipping file save');
      return '';
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultFilename = `ukraine-mercenaries_${timestamp}.json`;
    const finalFilename = filename || defaultFilename;
    
    // Save to cache directory
    const cacheDir = path.join(process.cwd(), 'cache', 'ukraine-mercenaries');
    await fs.mkdir(cacheDir, { recursive: true });
    
    const cachePath = path.join(cacheDir, finalFilename);
    await fs.writeFile(cachePath, JSON.stringify(records, null, 2));
    
    // Also save to data directory for production use
    const dataDir = path.join(process.cwd(), 'src', 'data', 'ukraine');
    await fs.mkdir(dataDir, { recursive: true });
    
    const dataPath = path.join(dataDir, 'mercenaries.json');
    await fs.writeFile(dataPath, JSON.stringify(records, null, 2));
    
    console.log(`💾 Saved ${records.length} records to:`);
    console.log(`   Cache: ${cachePath}`);
    console.log(`   Data:  ${dataPath}`);
    
    return cachePath;
  }
}

export function createLostArmourMercenariesScraper(config?: LostArmourMercenariesScraperConfig): LostArmourMercenariesScraper {
  return new LostArmourMercenariesScraper(config);
}

