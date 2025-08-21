import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

export interface RussiaScraperConfig {
  delayBetweenRequests?: number;
  maxRetries?: number;
  enableCaching?: boolean;
  maxPages?: number;
}

export type RussianCasualtyRecord = {
  date: string;
  fullName: string;
  confirmationLink: string;
  year?: number;
};

export class RussiaCasualtiesScraper {
  private config: RussiaScraperConfig;
  private dataPath: string;

  constructor(config: RussiaScraperConfig = {}) {
    this.config = {
      delayBetweenRequests: 2000,
      maxRetries: 3,
      enableCaching: true,
      maxPages: undefined,
      ...config
    };
    this.dataPath = path.join(process.cwd(), 'src', 'data', 'russia', 'casualties.json');
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  private async extractDataFromPageWithPuppeteer(pageNumber: number, browser: any): Promise<RussianCasualtyRecord[]> {
    const url = `https://svo.rf.gd/page/${pageNumber}.html`;
    
    try {
      const page = await browser.newPage();
      
      // Set realistic headers and user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
      });
      
      console.log(`Navigating to page ${pageNumber}...`);
      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });
      
      // Wait for content to fully load
      await this.sleep(3000);
      
      // Get the page content after JavaScript execution
      const html = await page.content();
      console.log(`Page ${pageNumber}: HTML length ${html.length} characters`);
      
      // Close the page to free memory
      await page.close();
      
      // Parse with Cheerio
      const $ = cheerio.load(html);
      const records: RussianCasualtyRecord[] = [];

      // Look for the main table
      const table = $('table').first();
      const rows = table.find('tr');
      
      console.log(`Page ${pageNumber}: Found ${rows.length} table rows`);

      // Process each row (skip header row)
      rows.slice(1).each((index, row) => {
        const cells = $(row).find('td');
        
        // Based on our inspection, the structure is:
        // Cell 0: Icon (📰)
        // Cell 1: Date (DD.MM.YYYY)
        // Cell 2: Full name
        // Cell 3: Age (often empty)
        // Cell 4: Location (often empty)  
        // Cell 5: Confirmation link
        
        if (cells.length >= 6) {
          const date = $(cells[1]).text().trim();
          const fullName = $(cells[2]).text().trim();
          const confirmationLink = $(cells[5]).find('a').attr('href')?.trim() || '';

          if (date && fullName) {
            // Extract year from date
            let year: number | undefined;
            const dateMatch = date.match(/(\d{4})/);
            if (dateMatch) {
              year = parseInt(dateMatch[1], 10);
            }

            records.push({
              date,
              fullName,
              confirmationLink,
              year
            });
          }
        }
      });

      console.log(`Page ${pageNumber}: Extracted ${records.length} records`);
      return records;
      
    } catch (error) {
      console.error(`Error extracting data from page ${pageNumber}:`, error);
      return [];
    }
  }

  async scrapeAllPages(): Promise<RussianCasualtyRecord[]> {
    const allRecords: RussianCasualtyRecord[] = [];
    let page = 1;
    let hasMore = true;
    let consecutiveEmptyPages = 0;

    console.log(`Starting Russian casualties scraping from svo.rf.gd...`);
    console.log(`Extracting ALL data first - deduplication will be run separately`);

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });

    try {
      while (hasMore && (!this.config.maxPages || page <= this.config.maxPages)) {
        try {
          const records = await this.extractDataFromPageWithPuppeteer(page, browser);

          if (records.length === 0) {
            consecutiveEmptyPages++;
            console.log(`Page ${page}: No records found (${consecutiveEmptyPages} consecutive empty pages)`);
            
            // Stop if we hit 3 consecutive empty pages
            if (consecutiveEmptyPages >= 3) {
              console.log('Stopping: 3 consecutive empty pages found');
              hasMore = false;
              break;
            }
          } else {
            consecutiveEmptyPages = 0;
            
            // Add ALL records without deduplication
            allRecords.push(...records);
            console.log(`Page ${page}: Added ${records.length} records (total: ${allRecords.length})`);
          }

          page++;
          
          // Add delay between requests
          if (hasMore && this.config.delayBetweenRequests && this.config.delayBetweenRequests > 0) {
            await this.sleep(this.config.delayBetweenRequests);
          }

        } catch (error) {
          console.error(`Error on page ${page}:`, error);
          hasMore = false;
        }
      }
    } finally {
      await browser.close();
    }

    console.log(`Scraping completed: ${allRecords.length} total raw records from ${page - 1} pages`);
    console.log(`Note: Data contains duplicates - run deduplication script separately`);
    return allRecords;
  }

  async saveToFile(records: RussianCasualtyRecord[]): Promise<string> {
    const dir = path.dirname(this.dataPath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(this.dataPath, JSON.stringify(records, null, 2));
    console.log(`💾 Russia casualties data saved to: ${this.dataPath}`);
    
    return this.dataPath;
  }

  async saveToFileWithTimestamp(records: RussianCasualtyRecord[]): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0];
    const timestampedPath = path.join(process.cwd(), 'src', 'data', 'russia', `casualties_${timestamp}.json`);
    
    const dir = path.dirname(timestampedPath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(timestampedPath, JSON.stringify(records, null, 2));
    console.log(`💾 Russia casualties data saved to: ${timestampedPath}`);
    
    return timestampedPath;
  }
}

export function createRussiaCasualtiesScraper(config: RussiaScraperConfig = {}): RussiaCasualtiesScraper {
  return new RussiaCasualtiesScraper(config);
}
