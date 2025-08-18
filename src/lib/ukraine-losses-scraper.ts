import { chromium, Browser, Page } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { CasualtyEntry, HistoricalData, ScrapingConfig } from '@/types';
import { DateParser, ParsedDate } from './date-parser';

interface ScrapingResult {
  casualties: CasualtyEntry[];
  totalPages: number;
  scrapedPages: number;
  errors: string[];
  summary: {
    totalEntries: number;
    validDeathDates: number;
    estimatedDeaths: number;
    confirmedDeaths: number;
    failedParses: number;
  };
}

interface MonthlyStats {
  [monthKey: string]: {
    confirmed: number;
    unconfirmed: number;
    total: number;
    entries: CasualtyEntry[];
  };
}

export class UkrainianLossesScraper {
  private baseUrl = 'https://ualosses.org/en/soldiers/';
  private browser: Browser | null = null;
  private config: ScrapingConfig;
  private cacheDir: string;
  private logFile: string;

  constructor(config: ScrapingConfig = {}) {
    this.config = {
      maxPages: config.maxPages || 50, // Default to sample pages for testing
      delayBetweenRequests: config.delayBetweenRequests || 2000,
      retryAttempts: config.retryAttempts || 3,
      enableCaching: config.enableCaching ?? true,
      incrementalUpdate: config.incrementalUpdate ?? false,
      ...config
    };

    this.cacheDir = path.join(process.cwd(), 'cache', 'ukraine-losses');
    this.logFile = path.join(this.cacheDir, 'scraping.log');
  }

  async scrape(): Promise<ScrapingResult> {
    try {
      await this.initializeCache();
      await this.log('Starting Ukrainian losses scraping...');

      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox', 
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      const result = await this.performScraping();
      
      await this.log(`Scraping completed: ${result.casualties.length} entries from ${result.scrapedPages} pages`);
      
      if (this.config.enableCaching) {
        await this.saveToCache(result);
      }

      return result;

    } catch (error) {
      const errorMsg = `Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await this.log(errorMsg);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  private async performScraping(): Promise<ScrapingResult> {
    const context = await this.browser!.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const casualties: CasualtyEntry[] = [];
    const errors: string[] = [];
    let totalPages = 0;
    let scrapedPages = 0;

    try {
      // First, determine the total number of pages
      await page.goto(this.baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await this.delay(1000);

      totalPages = await this.getTotalPages(page);
      await this.log(`Found ${totalPages} total pages`);

      // Determine which pages to scrape
      const pagesToScrape = this.getPagesToScrape(totalPages);
      await this.log(`Will scrape ${pagesToScrape.length} pages: ${pagesToScrape.slice(0, 10).join(', ')}${pagesToScrape.length > 10 ? '...' : ''}`);

      // Scrape each page
      for (const pageNum of pagesToScrape) {
        try {
          const pageCasualties = await this.scrapePage(page, pageNum);
          casualties.push(...pageCasualties);
          scrapedPages++;

          await this.log(`Page ${pageNum}: Found ${pageCasualties.length} entries (Total: ${casualties.length})`);
          await this.delay(this.config.delayBetweenRequests!);

        } catch (pageError) {
          const errorMsg = `Error scraping page ${pageNum}: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`;
          errors.push(errorMsg);
          await this.log(errorMsg);
        }
      }

    } finally {
      await page.close();
      await context.close();
    }

    // Generate summary statistics
    const summary = this.generateSummary(casualties);

    return {
      casualties,
      totalPages,
      scrapedPages,
      errors,
      summary
    };
  }

  private async getTotalPages(page: Page): Promise<number> {
    try {
      // Look for pagination indicators
      const paginationSelectors = [
        '.pagination .page-link:last-child',
        '.pagination a:last-child',
        '[data-page]:last-child',
        '.page-numbers:last-child'
      ];

      for (const selector of paginationSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const text = await element.textContent();
            const pageNum = parseInt(text?.trim() || '0', 10);
            if (pageNum > 0) {
              return pageNum;
            }
          }
        } catch {
          continue;
        }
      }

      // Fallback: try to find page numbers in the URL or text
      const pageText = await page.textContent('body');
      const pageMatch = pageText?.match(/page\s+\d+\s+of\s+(\d+)/i);
      if (pageMatch) {
        return parseInt(pageMatch[1], 10);
      }

      // Default fallback
      await this.log('Could not determine total pages, using default estimate');
      return 1589; // Known approximate total from the site

    } catch (error) {
      await this.log(`Error determining total pages: ${error}`);
      return 1589;
    }
  }

  private getPagesToScrape(totalPages: number): number[] {
    const maxPages = this.config.maxPages!;
    
    if (maxPages >= totalPages) {
      // Scrape all pages
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Create a representative sample
    const pages: number[] = [];
    
    // Always include first and last pages
    pages.push(1);
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    // Add evenly distributed pages
    const step = Math.floor(totalPages / (maxPages - 2));
    for (let i = step; i < totalPages; i += step) {
      if (pages.length >= maxPages) break;
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    // Fill remaining slots with random pages
    while (pages.length < maxPages && pages.length < totalPages) {
      const randomPage = Math.floor(Math.random() * totalPages) + 1;
      if (!pages.includes(randomPage)) {
        pages.push(randomPage);
      }
    }

    return pages.sort((a, b) => a - b);
  }

  private async scrapePage(page: Page, pageNum: number): Promise<CasualtyEntry[]> {
    const url = `${this.baseUrl}?page=${pageNum}`;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await this.delay(1000);

        // Extract casualty entries from the page
        const casualties = await page.evaluate(() => {
          const entries: CasualtyEntry[] = [];
          
          // Try multiple selectors to find casualty entries
          const selectors = [
            'li',
            '.soldier-entry',
            '.casualty-entry',
            'div[data-soldier]',
            '.list-group-item',
            'tr',
            'p'
          ];

          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            
            for (let i = 0; i < elements.length; i++) {
              const element = elements[i];
              const text = element.textContent?.trim() || '';
              
              if (text.length < 20 || text.length > 500) continue; // Filter out noise
              
              // Look for patterns that indicate a soldier entry
              // Pattern: Name + Date - Date
              const patterns = [
                // "Brazhko Ihor Volodymyrovych July 4, 1966 - March 16, 2024"
                /^([A-Za-z'\s]+?)\s+([A-Za-z]+\.?\s+\d{1,2},?\s+\d{4})\s*[-–—]\s*(\(?[A-Za-z]+\.?\s+\d{1,2},?\s+\d{4}\)?)/,
                // Alternative patterns
                /([A-Za-z'\s]{10,50})\s+(\d{1,2}\s+[A-Za-z]+\.?\s+\d{4})\s*[-–—]\s*(\(?[\d\s\w,\.()]+\)?)/
              ];

              for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                  const [, name, birthDate, deathDate] = match;
                  
                  // Validate that we have reasonable data
                  if (name && name.length > 5 && name.length < 100) {
                    const isEstimated = deathDate.includes('(') || deathDate.includes(')');
                    const cleanDeathDate = deathDate.replace(/[()]/g, '').trim();
                    
                    entries.push({
                      name: name.trim(),
                      birthDate: birthDate.trim(),
                      deathDate: cleanDeathDate,
                      isEstimated
                    });
                    break; // Don't match the same text with multiple patterns
                  }
                }
              }
            }
            
            // If we found entries with this selector, break
            if (entries.length > 0) break;
          }

          return entries;
        });

        if (casualties.length === 0) {
          throw new Error(`No casualties found on page ${pageNum}`);
        }

        return casualties;

      } catch (error) {
        if (attempt === this.config.retryAttempts) {
          throw error;
        }
        await this.log(`Attempt ${attempt} failed for page ${pageNum}, retrying...`);
        await this.delay(this.config.delayBetweenRequests! * attempt);
      }
    }

    return [];
  }

  private generateSummary(casualties: CasualtyEntry[]): ScrapingResult['summary'] {
    let validDeathDates = 0;
    let estimatedDeaths = 0;
    let confirmedDeaths = 0;
    let failedParses = 0;

    casualties.forEach(casualty => {
      if (casualty.deathDate) {
        const parsed = DateParser.parseDate(casualty.deathDate);
        if (parsed.date) {
          validDeathDates++;
          if (parsed.isEstimated || casualty.isEstimated) {
            estimatedDeaths++;
          } else {
            confirmedDeaths++;
          }
        } else {
          failedParses++;
        }
      } else {
        failedParses++;
      }
    });

    return {
      totalEntries: casualties.length,
      validDeathDates,
      estimatedDeaths,
      confirmedDeaths,
      failedParses
    };
  }

  async aggregateByMonth(casualties: CasualtyEntry[]): Promise<HistoricalData[]> {
    const monthlyStats: MonthlyStats = {};

    casualties.forEach(casualty => {
      if (!casualty.deathDate) return;

      const parsed = DateParser.parseDate(casualty.deathDate);
      if (!parsed.date || !DateParser.isValidCasualtyDate(parsed.date)) return;

      const monthKey = DateParser.formatToMonthKey(parsed.date);
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          confirmed: 0,
          unconfirmed: 0,
          total: 0,
          entries: []
        };
      }

      monthlyStats[monthKey].entries.push(casualty);
      monthlyStats[monthKey].total++;

      if (parsed.isEstimated || casualty.isEstimated) {
        monthlyStats[monthKey].unconfirmed++;
      } else {
        monthlyStats[monthKey].confirmed++;
      }
    });

    // Convert to HistoricalData format
    return Object.entries(monthlyStats)
      .map(([monthKey, stats]) => ({
        date: `${monthKey}-01`,
        casualties: stats.total,
        confirmed: stats.confirmed,
        unconfirmed: stats.unconfirmed
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async scaleToTotal(monthlyData: HistoricalData[], totalKnownCasualties: number): Promise<HistoricalData[]> {
    const sampleTotal = monthlyData.reduce((sum, item) => sum + item.casualties, 0);
    
    if (sampleTotal === 0) {
      await this.log('No sample data to scale');
      return monthlyData;
    }

    const scaleFactor = totalKnownCasualties / sampleTotal;
    await this.log(`Scaling factor: ${scaleFactor.toFixed(2)} (${totalKnownCasualties} / ${sampleTotal})`);

    return monthlyData.map(item => ({
      ...item,
      casualties: Math.round(item.casualties * scaleFactor),
      confirmed: item.confirmed ? Math.round(item.confirmed * scaleFactor) : undefined,
      unconfirmed: item.unconfirmed ? Math.round(item.unconfirmed * scaleFactor) : undefined
    }));
  }

  private async initializeCache(): Promise<void> {
    if (this.config.enableCaching) {
      await fs.mkdir(this.cacheDir, { recursive: true });
    }
  }

  private async saveToCache(result: ScrapingResult): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `scraping-result-${timestamp}.json`;
    const filepath = path.join(this.cacheDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(result, null, 2));
    await this.log(`Results cached to ${filename}`);
  }

  private async log(message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    console.log(message);
    
    if (this.config.enableCaching) {
      try {
        await fs.appendFile(this.logFile, logEntry);
      } catch {
        // Ignore logging errors
      }
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const createUkrainianLossesScraper = (config?: ScrapingConfig) => {
  return new UkrainianLossesScraper(config);
};
