import fs from 'fs/promises';
import path from 'path';
import { CasualtyData, HistoricalData, ScrapedData } from '@/types';
import fsSync from 'fs';

// Fallback data in case JSON file doesn't exist
const fallbackData: ScrapedData = {
  ukraine: {
    country: 'ukraine',
    total_losses: 158892,
    dead: 79061,
    missing: 75253,
    prisoners: 4578,
    last_updated: new Date().toISOString(),
    source_url: 'https://ualosses.org/en/soldiers/'
  },
  russia: {
    country: 'russia',
    total_losses: 121507,
    last_updated: new Date().toISOString(),
    source_url: 'https://en.zona.media/article/2025/08/01/casualties_eng-trl'
  },
  ukraineHistorical: [],
  russiaHistorical: [],
  youtubeVideos: [
    {
      title: 'Ukraine War Update - Latest Military Developments',
      youtube_id: 'dQw4w9WgXcQ',
      channel_name: 'History Legends',
    },
    {
      title: 'Military Analysis: Russia vs Ukraine Forces',
      youtube_id: 'oHg5SJYRHA0',
      channel_name: 'History Legends',
    },
    {
      title: 'War Report: Current Situation Analysis',
      youtube_id: 'fC7oUOUEEi4',
      channel_name: 'History Legends',
    },
  ],
  lastUpdated: new Date().toISOString()
};

export async function loadCasualtyData(): Promise<ScrapedData> {
  try {
    let data: ScrapedData = { ...fallbackData };
    
    // Load current Ukraine totals from Lost Armour data
    const ukraineTotals = await loadUkraineLostArmourTotals();
    if (ukraineTotals) {
      data.ukraine = ukraineTotals;
    }
    
    // Load Russia data from casualties.json if it exists
    try {
      const dataPath = path.join(process.cwd(), 'src', 'data', 'casualties.json');
      const fileContent = await fs.readFile(dataPath, 'utf8');
      const oldData = JSON.parse(fileContent);
      if (oldData.russia) {
        data.russia = oldData.russia;
      }
    } catch {
      // Keep fallback Russia data
    }
    
    // Load Ukraine monthly historical from RAW summaries
    const ukraineMonthlyHistorical = await loadCompiledUkraineMonthly();
    if (ukraineMonthlyHistorical.length > 0) {
      data.ukraineHistorical = ukraineMonthlyHistorical;
    }
    
    // Load Russia monthly historical from RAW summaries
    const russiaMonthlyHistorical = await loadCompiledRussiaMonthly();
    if (russiaMonthlyHistorical.length > 0) {
      data.russiaHistorical = russiaMonthlyHistorical;
    }
    
    // Load Ukraine weekly historical from RAW summaries
    const ukraineWeeklyHistorical = await loadCompiledUkraineWeekly();
    if (ukraineWeeklyHistorical.length > 0) {
      data.ukraineWeekly = ukraineWeeklyHistorical;
    }
    
    // Load Russia weekly historical from RAW summaries
    const russiaWeeklyHistorical = await loadCompiledRussiaWeekly();
    if (russiaWeeklyHistorical.length > 0) {
      data.russiaWeekly = russiaWeeklyHistorical;
    }
    
    // Update last updated timestamp
    data.lastUpdated = new Date().toISOString();
    
    return data;
  } catch (error) {
    console.warn('Could not load casualty data, using fallback data:', error);
    return fallbackData;
  }
}

// loadCasualtyDataClient function removed - Chart component now uses hardcoded data

export function getCasualtyBreakdown(data: CasualtyData): {
  dead: number;
  missing: number;
  prisoners: number;
} {
  return {
    dead: data.dead || 0,
    missing: data.missing || 0,
    prisoners: data.prisoners || 0
  };
}

export function formatLastUpdated(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short'
    });
  } catch (error) {
    return 'Unknown';
  }
}

// Load Ukraine totals from Lost Armour data
async function loadUkraineLostArmourTotals(): Promise<CasualtyData | null> {
  try {
    const ukrainePath = path.join(process.cwd(), 'src', 'data', 'ukraine', 'soldiers-raw.json');
    
    // Check if Lost Armour data exists
    if (!fsSync.existsSync(ukrainePath)) {
      console.log('📊 Lost Armour data not found, using fallback');
      return null;
    }
    
    const content = await fs.readFile(ukrainePath, 'utf8');
    const records: Array<{
      recordType: 'death' | 'missing';
      deathDate?: string;
      missingDate?: string;
    }> = JSON.parse(content);
    
    // Count deaths and missing persons
    let deaths = 0;
    let missing = 0;
    
    for (const record of records) {
      if (record.recordType === 'death') {
        deaths++;
      } else if (record.recordType === 'missing') {
        missing++;
      }
    }
    
    const total = deaths + missing;
    
    console.log(`📊 Loaded Ukraine Lost Armour totals: ${total.toLocaleString()} (${deaths.toLocaleString()} deaths, ${missing.toLocaleString()} missing)`);
    
    return {
      country: 'ukraine',
      total_losses: total,
      dead: deaths,
      missing: missing,
      prisoners: 0, // Lost Armour doesn't track prisoners
      last_updated: new Date().toISOString(),
      source_url: 'https://lostarmour.info/ukr200'
    };
    
  } catch (error) {
    console.warn('Failed to load Ukraine Lost Armour totals:', error);
    return null;
  }
}

// Load compiled monthly summaries from raw data (both Ukraine and Russia)
async function loadCompiledUkraineMonthly(): Promise<HistoricalData[]> {
  try {
    // First try to load from the new raw monthly summary
    const rawSummaryPath = path.join(process.cwd(), 'src', 'data', 'ukraine');
    if (fsSync.existsSync(rawSummaryPath)) {
      const files = await fs.readdir(rawSummaryPath);
      const candidates = files.filter(f => f.startsWith('monthly-raw_') && f.endsWith('.json'));
      if (candidates.length > 0) {
        candidates.sort();
        const latest = candidates[candidates.length - 1];
        const fullPath = path.join(rawSummaryPath, latest);
        const content = await fs.readFile(fullPath, 'utf8');
        const obj = JSON.parse(content) as Record<string, { deaths: number; missing: number; total: number }>;
        const arr: HistoricalData[] = Object.entries(obj)
          .map(([ym, counts]) => ({
            date: `${ym}-01`,
            casualties: counts.total,
            confirmed: counts.deaths,
            unconfirmed: counts.missing
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        console.log(`📊 Loaded Ukraine RAW monthly data: ${arr.length} months from ${latest}`);
        return arr;
      }
    }

    // Fallback to old cache directory
    const dir = path.join(process.cwd(), 'cache', 'ualosses');
    if (!fsSync.existsSync(dir)) return [];
    const files = await fs.readdir(dir);
    const candidates = files.filter(f => f.startsWith('ukraine_monthly_') && f.endsWith('.json'));
    if (candidates.length === 0) return [];
    // Pick latest by filename (dates in name sort lexicographically) or mtime as fallback
    candidates.sort();
    const latest = candidates[candidates.length - 1];
    const fullPath = path.join(dir, latest);
    const content = await fs.readFile(fullPath, 'utf8');
    const obj = JSON.parse(content) as Record<string, { deaths: number; missing: number; total: number }>;
    const arr: HistoricalData[] = Object.entries(obj)
      .map(([ym, counts]) => ({
        date: `${ym}-01`,
        casualties: counts.total,
        confirmed: counts.deaths,
        unconfirmed: counts.missing
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return arr;
  } catch {
    return [];
  }
}

// Load compiled Russia monthly data from raw summaries
async function loadCompiledRussiaMonthly(): Promise<HistoricalData[]> {
  try {
    const rawSummaryPath = path.join(process.cwd(), 'src', 'data', 'russia');
    if (fsSync.existsSync(rawSummaryPath)) {
      const files = await fs.readdir(rawSummaryPath);
      const candidates = files.filter(f => f.startsWith('monthly_') && f.endsWith('.json'));
      if (candidates.length > 0) {
        candidates.sort();
        const latest = candidates[candidates.length - 1];
        const fullPath = path.join(rawSummaryPath, latest);
        const content = await fs.readFile(fullPath, 'utf8');
        const obj = JSON.parse(content) as Record<string, { deaths: number; total: number }>;
        const arr: HistoricalData[] = Object.entries(obj)
          .map(([ym, counts]) => ({
            date: `${ym}-01`,
            casualties: counts.total, // For Russia, total = deaths (no missing category)
            confirmed: counts.deaths,
            unconfirmed: 0 // Russia data doesn't have missing
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        console.log(`📊 Loaded Russia RAW monthly data: ${arr.length} months from ${latest}`);
        return arr;
      }
    }
    return [];
  } catch {
    return [];
  }
}

// Load compiled Ukraine weekly data from raw summaries
async function loadCompiledUkraineWeekly(): Promise<HistoricalData[]> {
  try {
    const rawSummaryPath = path.join(process.cwd(), 'src', 'data', 'ukraine');
    if (fsSync.existsSync(rawSummaryPath)) {
      const files = await fs.readdir(rawSummaryPath);
      const candidates = files.filter(f => f.startsWith('weekly-raw_') && f.endsWith('.json'));
      if (candidates.length > 0) {
        candidates.sort();
        const latest = candidates[candidates.length - 1];
        const fullPath = path.join(rawSummaryPath, latest);
        const content = await fs.readFile(fullPath, 'utf8');
        const obj = JSON.parse(content) as Record<string, { deaths: number; missing: number; total: number }>;
        const arr: HistoricalData[] = Object.entries(obj)
          .map(([week, counts]) => ({
            date: week, // Use week key directly (e.g., "2022-W09")
            casualties: counts.total,
            confirmed: counts.deaths,
            unconfirmed: counts.missing
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
        console.log(`📊 Loaded Ukraine RAW weekly data: ${arr.length} weeks from ${latest}`);
        return arr;
      }
    }
    return [];
  } catch {
    return [];
  }
}

// Load compiled Russia weekly data from raw summaries
async function loadCompiledRussiaWeekly(): Promise<HistoricalData[]> {
  try {
    const rawSummaryPath = path.join(process.cwd(), 'src', 'data', 'russia');
    if (fsSync.existsSync(rawSummaryPath)) {
      const files = await fs.readdir(rawSummaryPath);
      const candidates = files.filter(f => f.startsWith('weekly_') && f.endsWith('.json'));
      if (candidates.length > 0) {
        candidates.sort();
        const latest = candidates[candidates.length - 1];
        const fullPath = path.join(rawSummaryPath, latest);
        const content = await fs.readFile(fullPath, 'utf8');
        const obj = JSON.parse(content) as Record<string, { deaths: number; total: number }>;
        const arr: HistoricalData[] = Object.entries(obj)
          .map(([week, counts]) => ({
            date: week, // Use week key directly (e.g., "2022-W09")
            casualties: counts.total,
            confirmed: counts.deaths,
            unconfirmed: 0 // Russia data doesn't have missing
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
        console.log(`📊 Loaded Russia RAW weekly data: ${arr.length} weeks from ${latest}`);
        return arr;
      }
    }
    return [];
  } catch {
    return [];
  }
}
