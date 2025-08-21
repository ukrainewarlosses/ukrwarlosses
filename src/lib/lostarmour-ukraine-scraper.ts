import fs from 'fs/promises';
import path from 'path';

export interface LostArmourUkraineRecord {
  fullname: string;
  alt_fullname: string | null;
  rank: string | null;
  conscription: string | null;
  days_from_conscription: string | null;
  age: string | null;
  sex: string;
  date_of_birth: string | null;
  date_of_death: string | null;
  date_of_conscription: string | null;
  date_of_funeral: string | null;
  is_died_from_wounds: string;
  is_from_decrees: string;
  sources: string;
  death_at: string | null;
  region_of_live: string | null;
  region_of_death: string | null;
  region_of_funeral: string | null;
}

export interface LostArmourApiResponse {
  items: LostArmourUkraineRecord[];
  paginator: {
    on_page: number;
    per_page: number;
    page: number;
    pages: number;
    total: number;
  };
}

export interface LostArmourScraperConfig {
  delayBetweenRequests?: number;
  maxRetries?: number;
  enableCaching?: boolean;
}

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://lostarmour.info/'
};

// Ukrainian alphabet letters for the API
const UKRAINIAN_LETTERS = [
  'А', 'Б', 'В', 'Г', 'Ґ', 'Д', 'Е', 'Є', 'Ж', 'З', 'И', 'І', 'Ї', 'Й',
  'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч',
  'Ш', 'Щ', 'Ь', 'Ю', 'Я'
];

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, maxRetries: number): Promise<LostArmourApiResponse> {
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

      const data: LostArmourApiResponse = await response.json();
      
      console.log(`  ✅ Success: ${data.items.length} records, page ${data.paginator.page}/${data.paginator.pages}`);
      return data;
      
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

async function scrapeLetterPages(letter: string, config: LostArmourScraperConfig): Promise<LostArmourUkraineRecord[]> {
  const allRecords: LostArmourUkraineRecord[] = [];
  let currentPage = 1;
  let hasMorePages = true;
  
  console.log(`🔤 Scraping letter "${letter}"...`);
  
  while (hasMorePages) {
    try {
      const encodedLetter = encodeURIComponent(letter);
      const url = `https://lostarmour.info/panel/next/api/public/ukr200/search?letter=${encodedLetter}&page=${currentPage}`;
      
      const response = await fetchWithRetry(url, config.maxRetries || 3);
      
      if (response.items && response.items.length > 0) {
        allRecords.push(...response.items);
        console.log(`  📄 Page ${currentPage}: ${response.items.length} records (total so far: ${allRecords.length})`);
        
        // Check if there are more pages
        hasMorePages = currentPage < response.paginator.pages;
        currentPage++;
        
        // Add delay between requests
        if (hasMorePages && config.delayBetweenRequests) {
          await sleep(config.delayBetweenRequests);
        }
      } else {
        console.log(`  📄 Page ${currentPage}: No records found, stopping`);
        hasMorePages = false;
      }
      
    } catch (error) {
      console.error(`  ❌ Error scraping letter "${letter}" page ${currentPage}:`, error);
      hasMorePages = false;
    }
  }
  
  console.log(`✅ Letter "${letter}" completed: ${allRecords.length} records`);
  return allRecords;
}

export class LostArmourUkraineScraper {
  private config: Required<LostArmourScraperConfig>;
  
  constructor(config: LostArmourScraperConfig = {}) {
    this.config = {
      delayBetweenRequests: config.delayBetweenRequests || 1000,
      maxRetries: config.maxRetries || 3,
      enableCaching: config.enableCaching ?? true
    };
  }
  
  async scrapeAllLetters(): Promise<LostArmourUkraineRecord[]> {
    console.log('🚀 Starting Lost Armour Ukraine scraping...');
    console.log(`📋 Will scrape ${UKRAINIAN_LETTERS.length} letters with ${this.config.delayBetweenRequests}ms delay`);
    
    const allRecords: LostArmourUkraineRecord[] = [];
    let letterCount = 0;
    
    for (const letter of UKRAINIAN_LETTERS) {
      letterCount++;
      console.log(`\n[${letterCount}/${UKRAINIAN_LETTERS.length}] Processing letter: ${letter}`);
      
      try {
        const letterRecords = await scrapeLetterPages(letter, this.config);
        allRecords.push(...letterRecords);
        
        console.log(`✅ Letter "${letter}" completed: ${letterRecords.length} records`);
        console.log(`📊 Running total: ${allRecords.length} records`);
        
        // Add delay between letters
        if (letterCount < UKRAINIAN_LETTERS.length && this.config.delayBetweenRequests) {
          await sleep(this.config.delayBetweenRequests);
        }
        
      } catch (error) {
        console.error(`❌ Failed to scrape letter "${letter}":`, error);
        // Continue with next letter instead of stopping
      }
    }
    
    console.log(`\n🎉 Lost Armour scraping completed!`);
    console.log(`📊 Total records collected: ${allRecords.length}`);
    
    return allRecords;
  }
  
  async saveToFile(records: LostArmourUkraineRecord[], filename?: string): Promise<string> {
    if (!this.config.enableCaching) {
      console.log('💾 Caching disabled, skipping file save');
      return '';
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultFilename = `ukraine-lostarmour_${timestamp}.json`;
    const finalFilename = filename || defaultFilename;
    
    // Save to cache directory
    const cacheDir = path.join(process.cwd(), 'cache', 'ukraine-lostarmour');
    await fs.mkdir(cacheDir, { recursive: true });
    
    const cachePath = path.join(cacheDir, finalFilename);
    await fs.writeFile(cachePath, JSON.stringify(records, null, 2));
    
    // Also save to data directory for production use
    const dataDir = path.join(process.cwd(), 'src', 'data', 'ukraine');
    await fs.mkdir(dataDir, { recursive: true });
    
    const dataPath = path.join(dataDir, 'soldiers-raw.json');
    await fs.writeFile(dataPath, JSON.stringify(records, null, 2));
    
    console.log(`💾 Saved ${records.length} records to:`);
    console.log(`   Cache: ${cachePath}`);
    console.log(`   Data:  ${dataPath}`);
    
    return cachePath;
  }
  
  // Convert Lost Armour format to our existing format for compatibility
  convertToStandardFormat(records: LostArmourUkraineRecord[]): any[] {
    return records.map(record => ({
      name: record.fullname || '',
      birthDate: this.normalizeDate(record.date_of_birth) || '',
      deathDate: this.normalizeDate(record.date_of_death || record.death_at) || '',
      missingDate: '', // Lost Armour doesn't distinguish missing vs dead - all are deaths
      location: this.combineLocation(record.region_of_live, record.region_of_death),
      rawText: this.buildRawText(record),
      pageSource: 'lostarmour.info',
      detailUrl: '', // Lost Armour doesn't provide individual URLs
      // Additional fields from Lost Armour
      rank: record.rank || '',
      age: record.age || '',
      conscription: record.conscription || '',
      sources: record.sources ? decodeURIComponent(record.sources) : ''
    }));
  }
  
  private normalizeDate(dateStr: string | null): string {
    if (!dateStr) return '';
    
    // Lost Armour uses formats like "06.11.1973" or "2022-09-23"
    if (dateStr.includes('.')) {
      // DD.MM.YYYY format
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    } else if (dateStr.includes('-')) {
      // Already in YYYY-MM-DD format
      return dateStr;
    }
    
    return dateStr;
  }
  
  private combineLocation(liveRegion: string | null, deathRegion: string | null): string {
    const regions = [liveRegion, deathRegion].filter(Boolean);
    return regions.length > 0 ? regions.join(', ') : '';
  }
  
  private buildRawText(record: LostArmourUkraineRecord): string {
    const parts = [
      record.fullname,
      record.date_of_birth,
      record.date_of_death || record.death_at,
      this.combineLocation(record.region_of_live, record.region_of_death)
    ].filter(Boolean);
    
    return parts.join(' - ');
  }
}

export function createLostArmourUkraineScraper(config?: LostArmourScraperConfig): LostArmourUkraineScraper {
  return new LostArmourUkraineScraper(config);
}
