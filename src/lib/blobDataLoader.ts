import { CasualtyData, HistoricalData, ScrapedData } from '@/types';

// Fallback data in case blob files don't exist
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

// Helper function to fetch JSON from blob storage
async function fetchFromBlob<T>(blobUrl: string): Promise<T | null> {
  try {
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching ${blobUrl}`);
    }
    return await response.json() as T;
  } catch (error) {
    console.warn(`Failed to fetch from blob ${blobUrl}:`, error);
    return null;
  }
}

// Load Ukraine Lost Armour totals from blob
async function loadUkraineLostArmourTotals(): Promise<CasualtyData | null> {
  try {
    const data = await fetchFromBlob<CasualtyData[]>(process.env.UKRAINE_SOLDIERS_BLOB_URL || '');
    if (data && data.length > 0) {
      const latest = data[data.length - 1];
      return {
        country: 'ukraine',
        total_losses: latest.total_losses || 0,
        dead: latest.dead || 0,
        missing: latest.missing || 0,
        prisoners: latest.prisoners || 0,
        last_updated: latest.last_updated || new Date().toISOString(),
        source_url: latest.source_url || 'https://ualosses.org/en/soldiers/'
      };
    }
  } catch (error) {
    console.warn('Failed to load Ukraine Lost Armour totals from blob:', error);
  }
  return null;
}

// Load compiled Ukraine monthly data from blob
async function loadCompiledUkraineMonthly(): Promise<HistoricalData[]> {
  try {
    const data = await fetchFromBlob<Record<string, { deaths: number; missing: number; total: number }>>(
      process.env.UKRAINE_MONTHLY_BLOB_URL || ''
    );
    if (data) {
      return Object.entries(data)
        .map(([date, stats]) => ({
          date,
          casualties: stats.total,
          confirmed: stats.deaths,
          unconfirmed: stats.missing
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }
  } catch (error) {
    console.warn('Failed to load Ukraine monthly data from blob:', error);
  }
  return [];
}

// Load compiled Russia monthly data from blob
async function loadCompiledRussiaMonthly(): Promise<HistoricalData[]> {
  try {
    const data = await fetchFromBlob<Record<string, { deaths: number; total: number }>>(
      process.env.RUSSIA_MONTHLY_BLOB_URL || ''
    );
    if (data) {
      return Object.entries(data)
        .map(([date, stats]) => ({
          date,
          casualties: stats.total
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }
  } catch (error) {
    console.warn('Failed to load Russia monthly data from blob:', error);
  }
  return [];
}

// Load compiled Ukraine weekly data from blob
async function loadCompiledUkraineWeekly(): Promise<HistoricalData[]> {
  try {
    const data = await fetchFromBlob<Record<string, { deaths: number; missing: number; total: number }>>(
      process.env.UKRAINE_WEEKLY_BLOB_URL || ''
    );
    if (data) {
      return Object.entries(data)
        .map(([date, stats]) => ({
          date,
          casualties: stats.total,
          confirmed: stats.deaths,
          unconfirmed: stats.missing
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }
  } catch (error) {
    console.warn('Failed to load Ukraine weekly data from blob:', error);
  }
  return [];
}

// Load compiled Russia weekly data from blob
async function loadCompiledRussiaWeekly(): Promise<HistoricalData[]> {
  try {
    const data = await fetchFromBlob<Record<string, { deaths: number; total: number }>>(
      process.env.RUSSIA_WEEKLY_BLOB_URL || ''
    );
    if (data) {
      return Object.entries(data)
        .map(([date, stats]) => ({
          date,
          casualties: stats.total
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }
  } catch (error) {
    console.warn('Failed to load Russia weekly data from blob:', error);
  }
  return [];
}

export async function loadCasualtyDataFromBlob(): Promise<ScrapedData> {
  try {
    let data: ScrapedData = { ...fallbackData };
    
    // Load current Ukraine totals from Lost Armour data
    const ukraineTotals = await loadUkraineLostArmourTotals();
    if (ukraineTotals) {
      data.ukraine = ukraineTotals;
    }
    
    // Load Ukraine monthly historical from blob
    const ukraineMonthlyHistorical = await loadCompiledUkraineMonthly();
    if (ukraineMonthlyHistorical.length > 0) {
      data.ukraineHistorical = ukraineMonthlyHistorical;
    }
    
    // Load Russia monthly historical from blob
    const russiaMonthlyHistorical = await loadCompiledRussiaMonthly();
    if (russiaMonthlyHistorical.length > 0) {
      data.russiaHistorical = russiaMonthlyHistorical;
    }
    
    // Load Ukraine weekly historical from blob
    const ukraineWeeklyHistorical = await loadCompiledUkraineWeekly();
    if (ukraineWeeklyHistorical.length > 0) {
      data.ukraineWeekly = ukraineWeeklyHistorical;
    }
    
    // Load Russia weekly historical from blob
    const russiaWeeklyHistorical = await loadCompiledRussiaWeekly();
    if (russiaWeeklyHistorical.length > 0) {
      data.russiaWeekly = russiaWeeklyHistorical;
    }
    
    // Update last updated timestamp
    data.lastUpdated = new Date().toISOString();
    
    return data;
  } catch (error) {
    console.warn('Could not load casualty data from blob, using fallback data:', error);
    return fallbackData;
  }
}
