import fs from 'fs/promises';
import path from 'path';

export interface LostArmourMissingRecord {
  fullname: string;
  age: string | null;
  date_of_birth: string | null;
  date_of_miss: string | null;
  region_of_miss: string | null;
  // Additional computed fields
  estimated_death_date?: string;
}

export interface LostArmourMissingApiResponse {
  items: LostArmourMissingRecord[];
  paginator: {
    on_page: number;
    per_page: number;
    page: number;
    pages: number;
    total: number;
  };
}

export interface LostArmourMissingScraperConfig {
  delayBetweenRequests?: number;
  maxRetries?: number;
  enableCaching?: boolean;
  maxPages?: number;
}

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://lostarmour.info/'
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, maxRetries: number): Promise<LostArmourMissingApiResponse> {
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

      const data: LostArmourMissingApiResponse = await response.json();
      console.log(`  ✅ Success: ${data.items.length} records, page ${data.paginator.page}/${data.paginator.pages}`);
      return data;
      
    } catch (error) {
      lastError = error as Error;
      console.log(`  ❌ Attempt ${attempt} failed:`, error);
      
      if (attempt <= maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`  ⏳ Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

export class LostArmourMissingScraper {
  private config: Required<LostArmourMissingScraperConfig>;
  
  constructor(config: LostArmourMissingScraperConfig = {}) {
    this.config = {
      delayBetweenRequests: config.delayBetweenRequests || 2000,
      maxRetries: config.maxRetries || 3,
      enableCaching: config.enableCaching ?? true,
      maxPages: config.maxPages || 0 // 0 = no limit
    };
  }
  
  async scrapeAllLetters(): Promise<LostArmourMissingRecord[]> {
    console.log('🚀 Starting Lost Armour Missing Persons scraping via API...');
    console.log(`📋 Config: delay=${this.config.delayBetweenRequests}ms, maxPages=${this.config.maxPages || 'unlimited'}`);
    
    const allRecords: LostArmourMissingRecord[] = [];
    
    // Ukrainian alphabet letters for the API (same as deaths scraper)
    const UKRAINIAN_LETTERS = [
      'А', 'Б', 'В', 'Г', 'Ґ', 'Д', 'Е', 'Є', 'Ж', 'З', 'И', 'І', 'Ї', 'Й',
      'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч',
      'Ш', 'Щ', 'Ь', 'Ю', 'Я'
    ];
    
    let letterCount = 0;
    
    try {
      for (const letter of UKRAINIAN_LETTERS) {
        letterCount++;
        console.log(`\n[${letterCount}/${UKRAINIAN_LETTERS.length}] Processing letter: ${letter}`);
        
        // Scrape all pages for this letter
        const letterRecords = await this.scrapeLetterPages(letter);
        allRecords.push(...letterRecords);
        
        console.log(`✅ Letter "${letter}" completed: ${letterRecords.length} records`);
        console.log(`📊 Running total: ${allRecords.length} records`);
        
        // Add delay between letters
        if (letterCount < UKRAINIAN_LETTERS.length && this.config.delayBetweenRequests) {
          await sleep(this.config.delayBetweenRequests);
        }
        
        // Apply maxPages limit if set (treat as max letters for testing)
        if (this.config.maxPages > 0 && letterCount >= this.config.maxPages) {
          console.log(`📄 Reached maxPages (letters) limit: ${this.config.maxPages}`);
          break;
        }
      }
      
    } catch (error) {
      console.error('❌ Error scraping missing persons:', error);
      throw error;
    }
    
    console.log(`\n🎉 Missing persons scraping completed!`);
    console.log(`📊 Total missing persons collected: ${allRecords.length}`);
    
    return allRecords;
  }
  
  private async scrapeLetterPages(letter: string): Promise<LostArmourMissingRecord[]> {
    const letterRecords: LostArmourMissingRecord[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    
    console.log(`🔤 Scraping letter "${letter}"...`);
    
    while (hasMorePages) {
      try {
        const encodedLetter = encodeURIComponent(letter);
        const apiUrl = `https://lostarmour.info/panel/next/api/public/ukr-mia/search?letter=${encodedLetter}&page=${currentPage}`;
        
        if (currentPage > 1 && this.config.delayBetweenRequests > 0) {
          await sleep(this.config.delayBetweenRequests);
        }
        
        const response = await fetchWithRetry(apiUrl, this.config.maxRetries);
        
        if (response.items && response.items.length > 0) {
          letterRecords.push(...response.items);
          console.log(`  📄 Page ${currentPage}: ${response.items.length} records (letter total: ${letterRecords.length})`);
          
          // Check if we should continue
          hasMorePages = currentPage < response.paginator.pages;
          currentPage++;
          
        } else {
          console.log(`  📄 Page ${currentPage}: No records found, stopping`);
          hasMorePages = false;
        }
        
      } catch (error) {
        console.error(`  ❌ Error on letter "${letter}" page ${currentPage}:`, error);
        hasMorePages = false;
      }
    }
    
    return letterRecords;
  }
  
  async saveToFile(records: LostArmourMissingRecord[], filename?: string): Promise<string> {
    if (!this.config.enableCaching) {
      console.log('💾 Caching disabled, skipping file save');
      return '';
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultFilename = `ukraine-missing_${timestamp}.json`;
    const finalFilename = filename || defaultFilename;
    
    // Save to cache directory
    const cacheDir = path.join(process.cwd(), 'cache', 'ukraine-lostarmour');
    await fs.mkdir(cacheDir, { recursive: true });
    
    const cachePath = path.join(cacheDir, finalFilename);
    await fs.writeFile(cachePath, JSON.stringify(records, null, 2));
    
    console.log(`💾 Missing persons data saved: ${cachePath}`);
    return cachePath;
  }
  
  // Convert to standard format for merging with deaths data
  convertToStandardFormat(records: LostArmourMissingRecord[]): any[] {
    return records.map(record => ({
      name: record.fullname || '',
      birthDate: this.normalizeDate(record.date_of_birth) || '',
      deathDate: '', // Missing persons don't have confirmed death dates
      missingDate: this.normalizeDate(record.date_of_miss) || '',
      location: record.region_of_miss || '',
      rawText: this.buildRawText(record),
      pageSource: 'lostarmour.info',
      detailUrl: '',
      // Additional fields
      age: record.age || '',
      estimatedDeathDate: this.normalizeDate(record.date_of_miss) || ''
    }));
  }
  
  private normalizeDate(dateStr: string | null): string {
    if (!dateStr) return '';
    
    // Handle various date formats from Lost Armour
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
  
  private buildRawText(record: LostArmourMissingRecord): string {
    const parts = [
      record.fullname,
      record.date_of_birth,
      `(missing: ${record.date_of_miss})`,
      record.region_of_miss
    ].filter(Boolean);
    
    return parts.join(' - ');
  }
}

export function createLostArmourMissingScraper(config?: LostArmourMissingScraperConfig): LostArmourMissingScraper {
  return new LostArmourMissingScraper(config);
}
