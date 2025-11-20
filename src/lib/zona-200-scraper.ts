import fs from 'fs/promises';
import path from 'path';

export interface Zona200Fighter {
  url: string;
  name: string;
  id: number;
  color: number;
}

export interface Zona200ApiResponse {
  name: string;
  region: string;
  regionDisplay: string;
  type: string;
  rank: string | null;
  age: number | null;
  birth: string | null;
  death: string | null;
  source: string;
  uid: string;
  new: number;
}

export interface Zona200ScraperConfig {
  delayBetweenRequests?: number;
  maxRetries?: number;
  enableCaching?: boolean;
}

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://200.zona.media/'
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchFighterWithRetry(
  urlSlug: string,
  maxRetries: number
): Promise<Zona200ApiResponse | null> {
  let lastError: Error | null = null;
  
  // URL encode the slug (spaces are already replaced with underscores in the provided data)
  const encodedSlug = encodeURIComponent(urlSlug);
  const apiUrl = `https://200.zona.media/api/case/${encodedSlug}`;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        headers: DEFAULT_HEADERS,
        method: 'GET'
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`  ⚠️  Fighter not found (404): ${urlSlug}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: Zona200ApiResponse = await response.json();
      return data;
      
    } catch (error) {
      lastError = error as Error;
      
      if (attempt <= maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        console.log(`  ⏳ Retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
        await sleep(delay);
      }
    }
  }
  
  console.error(`  ❌ Failed after ${maxRetries} retries: ${urlSlug}`);
  return null;
}

export class Zona200Scraper {
  private config: Required<Zona200ScraperConfig>;
  
  constructor(config: Zona200ScraperConfig = {}) {
    this.config = {
      delayBetweenRequests: config.delayBetweenRequests || 1000,
      maxRetries: config.maxRetries || 3,
      enableCaching: config.enableCaching ?? true
    };
  }
  
  async scrapeFighters(fighters: Zona200Fighter[]): Promise<Array<Zona200ApiResponse & { originalUrl: string; originalId: number }>> {
    console.log(`🚀 Starting Zona 200 scraping...`);
    console.log(`📋 Will scrape ${fighters.length} fighters`);
    console.log(`⏱️  Delay between requests: ${this.config.delayBetweenRequests}ms`);
    
    const results: Array<Zona200ApiResponse & { originalUrl: string; originalId: number }> = [];
    let successCount = 0;
    let errorCount = 0;
    let notFoundCount = 0;
    
    for (let i = 0; i < fighters.length; i++) {
      const fighter = fighters[i];
      const progress = `[${i + 1}/${fighters.length}]`;
      
      console.log(`\n${progress} Fetching: ${fighter.name} (ID: ${fighter.id})`);
      
      try {
        const data = await fetchFighterWithRetry(fighter.url, this.config.maxRetries);
        
        if (data) {
          results.push({
            ...data,
            originalUrl: fighter.url,
            originalId: fighter.id
          });
          successCount++;
          console.log(`  ✅ Success: ${data.name} - ${data.regionDisplay || data.region}`);
        } else {
          notFoundCount++;
        }
        
        // Add delay between requests (except for the last one)
        if (i < fighters.length - 1 && this.config.delayBetweenRequests > 0) {
          await sleep(this.config.delayBetweenRequests);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error fetching ${fighter.name}:`, error);
        // Continue with next fighter instead of stopping
      }
    }
    
    console.log(`\n🎉 Scraping completed!`);
    console.log(`📊 Results:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⚠️  Not found: ${notFoundCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total collected: ${results.length}`);
    
    return results;
  }
  
  async saveToFile(
    records: Array<Zona200ApiResponse & { originalUrl: string; originalId: number }>,
    filename?: string
  ): Promise<string> {
    if (!this.config.enableCaching) {
      console.log('💾 Caching disabled, skipping file save');
      return '';
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultFilename = `zona-200-foreigners_${timestamp}.json`;
    const finalFilename = filename || defaultFilename;
    
    // Save to cache directory
    const cacheDir = path.join(process.cwd(), 'cache', 'zona-200');
    await fs.mkdir(cacheDir, { recursive: true });
    
    const cachePath = path.join(cacheDir, finalFilename);
    await fs.writeFile(cachePath, JSON.stringify(records, null, 2));
    
    // Also save to data directory for production use
    const dataDir = path.join(process.cwd(), 'src', 'data', 'russia');
    await fs.mkdir(dataDir, { recursive: true });
    
    // Use the same filename (without timestamp) for the data directory
    const dataFilename = filename ? filename.replace(/_\d{4}-\d{2}-\d{2}\.json$/, '.json') : 'zona-200-foreigners.json';
    const dataPath = path.join(dataDir, dataFilename);
    await fs.writeFile(dataPath, JSON.stringify(records, null, 2));
    
    console.log(`💾 Saved ${records.length} records to:`);
    console.log(`   Cache: ${cachePath}`);
    console.log(`   Data:  ${dataPath}`);
    
    return cachePath;
  }
}

export function createZona200Scraper(config?: Zona200ScraperConfig): Zona200Scraper {
  return new Zona200Scraper(config);
}

