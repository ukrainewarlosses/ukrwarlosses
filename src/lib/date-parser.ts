/**
 * Comprehensive date parser for Ukrainian war losses data
 * Handles various date formats from the ualosses.org website
 */

export interface ParsedDate {
  date: Date | null;
  isEstimated: boolean;
  originalText: string;
}

export class DateParser {
  private static readonly MONTH_ABBREVIATIONS: { [key: string]: number } = {
    'Jan': 0, 'Jan.': 0, 'January': 0,
    'Feb': 1, 'Feb.': 1, 'February': 1,
    'Mar': 2, 'Mar.': 2, 'March': 2,
    'Apr': 3, 'Apr.': 3, 'April': 3,
    'May': 4,
    'Jun': 5, 'Jun.': 5, 'June': 5,
    'Jul': 6, 'Jul.': 6, 'July': 6,
    'Aug': 7, 'Aug.': 7, 'August': 7,
    'Sep': 8, 'Sep.': 8, 'September': 8,
    'Oct': 9, 'Oct.': 9, 'October': 9,
    'Nov': 10, 'Nov.': 10, 'November': 10,
    'Dec': 11, 'Dec.': 11, 'December': 11
  };

  /**
   * Parse a date string from the Ukrainian losses website
   * Handles formats like:
   * - "March 16, 2024"
   * - "Mar. 16, 2024"
   * - "(Feb. 17, 2025)" - estimated/unconfirmed
   * - "July 4, 1966"
   * - "Jan. 19, 1981"
   */
  static parseDate(dateText: string): ParsedDate {
    if (!dateText || typeof dateText !== 'string') {
      return {
        date: null,
        isEstimated: false,
        originalText: dateText || ''
      };
    }

    const trimmed = dateText.trim();
    const isEstimated = trimmed.startsWith('(') && trimmed.endsWith(')');
    const cleanText = trimmed.replace(/[()]/g, '');

    // Try different date parsing strategies
    const strategies = [
      this.parseStandardFormat,
      this.parseAbbreviatedFormat,
      this.parseAlternativeFormat
    ];

    for (const strategy of strategies) {
      const result = strategy(cleanText);
      if (result) {
        return {
          date: result,
          isEstimated,
          originalText: trimmed
        };
      }
    }

    console.warn(`Failed to parse date: "${dateText}"`);
    return {
      date: null,
      isEstimated,
      originalText: trimmed
    };
  }

  /**
   * Parse standard format: "March 16, 2024" or "July 4, 1966"
   */
  private static parseStandardFormat(dateText: string): Date | null {
    try {
      // Try direct parsing first
      const date = new Date(dateText);
      if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
        return date;
      }
    } catch {
      // Continue to manual parsing
    }

    // Manual parsing for edge cases
    const match = dateText.match(/^([A-Za-z]+\.?)\s+(\d{1,2}),?\s+(\d{4})$/);
    if (match) {
      const [, monthStr, dayStr, yearStr] = match;
      const month = this.MONTH_ABBREVIATIONS[monthStr];
      
      if (month !== undefined) {
        const day = parseInt(dayStr, 10);
        const year = parseInt(yearStr, 10);
        
        if (day >= 1 && day <= 31 && year > 1900 && year <= new Date().getFullYear() + 1) {
          return new Date(year, month, day);
        }
      }
    }

    return null;
  }

  /**
   * Parse abbreviated format: "Mar. 16, 2024" or "Jan. 19, 1981"
   */
  private static parseAbbreviatedFormat(dateText: string): Date | null {
    const match = dateText.match(/^([A-Za-z]{3}\.?)\s+(\d{1,2}),?\s+(\d{4})$/);
    if (match) {
      const [, monthStr, dayStr, yearStr] = match;
      const month = this.MONTH_ABBREVIATIONS[monthStr];
      
      if (month !== undefined) {
        const day = parseInt(dayStr, 10);
        const year = parseInt(yearStr, 10);
        
        if (day >= 1 && day <= 31 && year > 1900 && year <= new Date().getFullYear() + 1) {
          return new Date(year, month, day);
        }
      }
    }

    return null;
  }

  /**
   * Parse alternative formats and edge cases
   */
  private static parseAlternativeFormat(dateText: string): Date | null {
    // Handle format without comma: "March 16 2024"
    const match = dateText.match(/^([A-Za-z]+\.?)\s+(\d{1,2})\s+(\d{4})$/);
    if (match) {
      const [, monthStr, dayStr, yearStr] = match;
      const month = this.MONTH_ABBREVIATIONS[monthStr];
      
      if (month !== undefined) {
        const day = parseInt(dayStr, 10);
        const year = parseInt(yearStr, 10);
        
        if (day >= 1 && day <= 31 && year > 1900 && year <= new Date().getFullYear() + 1) {
          return new Date(year, month, day);
        }
      }
    }

    return null;
  }

  /**
   * Parse a date range like "July 4, 1966 - March 16, 2024"
   * Returns both birth and death dates
   */
  static parseDateRange(rangeText: string): { 
    birthDate: ParsedDate; 
    deathDate: ParsedDate; 
  } {
    if (!rangeText || typeof rangeText !== 'string') {
      return {
        birthDate: { date: null, isEstimated: false, originalText: '' },
        deathDate: { date: null, isEstimated: false, originalText: '' }
      };
    }

    // Split on dash, handling various dash types
    const parts = rangeText.split(/\s*[-–—]\s+/);
    
    if (parts.length === 2) {
      return {
        birthDate: this.parseDate(parts[0].trim()),
        deathDate: this.parseDate(parts[1].trim())
      };
    }

    // If no valid split, try to find dates in the text
    const dateMatches = rangeText.match(/([A-Za-z]+\.?\s+\d{1,2},?\s+\d{4})/g);
    if (dateMatches && dateMatches.length >= 2) {
      return {
        birthDate: this.parseDate(dateMatches[0]),
        deathDate: this.parseDate(dateMatches[dateMatches.length - 1])
      };
    }

    return {
      birthDate: { date: null, isEstimated: false, originalText: rangeText },
      deathDate: { date: null, isEstimated: false, originalText: rangeText }
    };
  }

  /**
   * Format a date to YYYY-MM format for monthly aggregation
   */
  static formatToMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Validate if a parsed date is reasonable for war casualty data
   */
  static isValidCasualtyDate(date: Date): boolean {
    const warStart = new Date('2022-02-24');
    const now = new Date();
    const futureLimit = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    return date >= warStart && date <= futureLimit;
  }

  /**
   * Get a human-readable summary of parsing results
   */
  static getSummary(results: ParsedDate[]): {
    total: number;
    parsed: number;
    estimated: number;
    failed: number;
  } {
    const total = results.length;
    const parsed = results.filter(r => r.date !== null).length;
    const estimated = results.filter(r => r.isEstimated && r.date !== null).length;
    const failed = results.filter(r => r.date === null).length;

    return { total, parsed, estimated, failed };
  }
}
