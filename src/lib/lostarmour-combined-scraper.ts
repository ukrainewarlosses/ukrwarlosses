import fs from 'fs/promises';
import path from 'path';
import { createLostArmourUkraineScraper, LostArmourUkraineRecord } from './lostarmour-ukraine-scraper';
import { createLostArmourMissingScraper, LostArmourMissingRecord } from './lostarmour-missing-scraper';

export interface CombinedUkraineRecord {
  name: string;
  birthDate: string;
  deathDate: string;
  missingDate: string;
  location: string;
  rawText: string;
  pageSource: string;
  detailUrl: string;
  // Additional fields
  rank?: string;
  age?: string;
  conscription?: string;
  sources?: string;
  recordType: 'death' | 'missing';
  estimatedDeathDate?: string;
}

export interface CombinedScraperConfig {
  delayBetweenRequests?: number;
  maxRetries?: number;
  enableCaching?: boolean;
  testMode?: boolean; // For testing with limited data
}

export class LostArmourCombinedScraper {
  private config: Required<CombinedScraperConfig>;
  
  constructor(config: CombinedScraperConfig = {}) {
    this.config = {
      delayBetweenRequests: config.delayBetweenRequests || 1500,
      maxRetries: config.maxRetries || 3,
      enableCaching: config.enableCaching ?? true,
      testMode: config.testMode ?? false
    };
  }
  
  async scrapeAllData(): Promise<CombinedUkraineRecord[]> {
    console.log('🚀 Starting Lost Armour Combined Ukraine scraping...');
    console.log(`📋 Mode: ${this.config.testMode ? 'TEST' : 'PRODUCTION'}`);
    
    const allRecords: CombinedUkraineRecord[] = [];
    
    try {
      // 1. Scrape Deaths Data
      console.log('\n📊 PHASE 1: Scraping Deaths Data...');
      const deathsScraper = createLostArmourUkraineScraper({
        delayBetweenRequests: this.config.delayBetweenRequests,
        maxRetries: this.config.maxRetries,
        enableCaching: this.config.enableCaching
      });
      
      let deathsRecords: LostArmourUkraineRecord[];
      
      if (this.config.testMode) {
        // Test mode: only scrape first 2 letters
        console.log('🧪 Test mode: scraping first 2 letters for deaths');
        deathsRecords = await this.scrapeTestDeaths(deathsScraper);
      } else {
        // Production mode: scrape all letters
        deathsRecords = await deathsScraper.scrapeAllLetters();
      }
      
      console.log(`✅ Deaths scraping completed: ${deathsRecords.length} records`);
      
      // Convert deaths to combined format
      const standardDeaths = deathsScraper.convertToStandardFormat(deathsRecords);
      const combinedDeaths: CombinedUkraineRecord[] = standardDeaths.map(record => ({
        ...record,
        recordType: 'death' as const,
        estimatedDeathDate: record.deathDate
      }));
      
      allRecords.push(...combinedDeaths);
      console.log(`📊 Added ${combinedDeaths.length} death records to combined dataset`);
      
      // 2. Scrape Missing Persons Data
      console.log('\n📊 PHASE 2: Scraping Missing Persons Data...');
      const missingScraper = createLostArmourMissingScraper({
        delayBetweenRequests: this.config.delayBetweenRequests,
        maxRetries: this.config.maxRetries,
        enableCaching: this.config.enableCaching,
        maxPages: this.config.testMode ? 5 : 0 // Limit pages in test mode
      });
      
      const missingRecords = await missingScraper.scrapeAllLetters();
      console.log(`✅ Missing persons scraping completed: ${missingRecords.length} records`);
      
      // Convert missing to combined format
      const standardMissing = missingScraper.convertToStandardFormat(missingRecords);
      const combinedMissing: CombinedUkraineRecord[] = standardMissing.map(record => ({
        ...record,
        recordType: 'missing' as const,
        estimatedDeathDate: record.estimatedDeathDate || record.missingDate
      }));
      
      allRecords.push(...combinedMissing);
      console.log(`📊 Added ${combinedMissing.length} missing records to combined dataset`);
      
      // 3. Summary
      console.log('\n🎉 Combined scraping completed!');
      console.log(`📊 Total combined records: ${allRecords.length}`);
      console.log(`   Deaths: ${combinedDeaths.length}`);
      console.log(`   Missing: ${combinedMissing.length}`);
      
      return allRecords;
      
    } catch (error) {
      console.error('❌ Combined scraping failed:', error);
      throw error;
    }
  }
  
  private async scrapeTestDeaths(scraper: any): Promise<LostArmourUkraineRecord[]> {
    // This is a simplified version that only scrapes first 2 letters for testing
    const testLetters = ['А', 'Б'];
    const allRecords: LostArmourUkraineRecord[] = [];
    
    for (const letter of testLetters) {
      console.log(`🔤 Test scraping letter: ${letter}`);
      
      let currentPage = 1;
      let hasMorePages = true;
      
      while (hasMorePages && currentPage <= 3) { // Limit to 3 pages per letter in test
        try {
          const encodedLetter = encodeURIComponent(letter);
          const url = `https://lostarmour.info/panel/next/api/public/ukr200/search?letter=${encodedLetter}&page=${currentPage}`;
          
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Referer': 'https://lostarmour.info/'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.items && data.items.length > 0) {
            allRecords.push(...data.items);
            console.log(`  📄 Page ${currentPage}: ${data.items.length} records (total: ${allRecords.length})`);
            hasMorePages = currentPage < data.paginator.pages && currentPage < 3;
            currentPage++;
            
            if (hasMorePages) {
              await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenRequests));
            }
          } else {
            hasMorePages = false;
          }
          
        } catch (error) {
          console.error(`  ❌ Error on page ${currentPage}:`, error);
          hasMorePages = false;
        }
      }
    }
    
    return allRecords;
  }
  
  async saveToFile(records: CombinedUkraineRecord[], filename?: string): Promise<string> {
    if (!this.config.enableCaching) {
      console.log('💾 Caching disabled, skipping file save');
      return '';
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultFilename = `ukraine-combined_${timestamp}.json`;
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
    
    console.log(`💾 Combined data saved to:`);
    console.log(`   Cache: ${cachePath}`);
    console.log(`   Data:  ${dataPath}`);
    
    return cachePath;
  }
  
  generateSummary(records: CombinedUkraineRecord[]): void {
    const deaths = records.filter(r => r.recordType === 'death');
    const missing = records.filter(r => r.recordType === 'missing');
    
    console.log('\n📊 COMBINED DATA SUMMARY:');
    console.log(`   Total records: ${records.length.toLocaleString()}`);
    console.log(`   Deaths: ${deaths.length.toLocaleString()}`);
    console.log(`   Missing: ${missing.length.toLocaleString()}`);
    
    // Date range analysis
    const allDates = records
      .map(r => r.deathDate || r.missingDate || r.estimatedDeathDate)
      .filter(Boolean)
      .sort();
    
    if (allDates.length > 0) {
      console.log(`   Date range: ${allDates[0]} to ${allDates[allDates.length - 1]}`);
    }
    
    // Sample records
    console.log('\n📋 Sample records:');
    const sampleDeaths = deaths.slice(0, 2);
    const sampleMissing = missing.slice(0, 2);
    
    sampleDeaths.forEach((record, i) => {
      console.log(`   Death ${i + 1}: ${record.name} (${record.birthDate} - ${record.deathDate})`);
    });
    
    sampleMissing.forEach((record, i) => {
      console.log(`   Missing ${i + 1}: ${record.name} (${record.birthDate} - missing: ${record.missingDate})`);
    });
  }
}

export function createLostArmourCombinedScraper(config?: CombinedScraperConfig): LostArmourCombinedScraper {
  return new LostArmourCombinedScraper(config);
}
