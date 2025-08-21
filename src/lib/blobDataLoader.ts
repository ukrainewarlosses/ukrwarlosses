import { CasualtyData, HistoricalData, ScrapedData } from '@/types';
import { discoverLatestBlobUrl } from './blobDiscovery';
import { YouTubeService } from './youtube';

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
  youtubeVideos: [],
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
    const soldiersUrl = await discoverLatestBlobUrl('soldiers');
    if (!soldiersUrl) {
      console.warn('No soldiers blob URL available');
      return null;
    }

    const data = await fetchFromBlob<CasualtyData[]>(soldiersUrl);
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

// Load Russia casualties data from blob
async function loadRussiaCasualtiesFromBlob(): Promise<CasualtyData | null> {
  try {
    const casualtiesUrl = await discoverLatestBlobUrl('casualties');
    if (!casualtiesUrl) {
      console.warn('No casualties blob URL available');
      return null;
    }

    const data = await fetchFromBlob<{ russia: CasualtyData }>(casualtiesUrl);
    if (data && data.russia) {
      return data.russia;
    }
  } catch (error) {
    console.warn('Failed to load Russia casualties from blob:', error);
  }
  return null;
}

// Load compiled Ukraine monthly data from blob
export async function loadCompiledUkraineMonthly(): Promise<HistoricalData[]> {
  try {
    const monthlyUrl = await discoverLatestBlobUrl('ukraine_monthly');
    if (!monthlyUrl) {
      console.warn('No Ukraine monthly blob URL available');
      return [];
    }

    const data = await fetchFromBlob<Record<string, { deaths: number; missing: number; total: number }>>(monthlyUrl);
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
export async function loadCompiledRussiaMonthly(): Promise<HistoricalData[]> {
  try {
    const monthlyUrl = await discoverLatestBlobUrl('russia_monthly');
    if (!monthlyUrl) {
      console.warn('No Russia monthly blob URL available');
      return [];
    }

    const data = await fetchFromBlob<Record<string, { deaths: number; total: number }>>(monthlyUrl);
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
    const weeklyUrl = await discoverLatestBlobUrl('ukraine_weekly');
    if (!weeklyUrl) {
      console.warn('No Ukraine weekly blob URL available');
      return [];
    }

    const data = await fetchFromBlob<Record<string, { deaths: number; missing: number; total: number }>>(weeklyUrl);
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
    const weeklyUrl = await discoverLatestBlobUrl('russia_weekly');
    if (!weeklyUrl) {
      console.warn('No Russia weekly blob URL available');
      return [];
    }

    const data = await fetchFromBlob<Record<string, { deaths: number; total: number }>>(weeklyUrl);
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
    
    // Load Russia casualties data from blob
    const russiaCasualties = await loadRussiaCasualtiesFromBlob();
    if (russiaCasualties) {
      data.russia = russiaCasualties;
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
    
    // Load YouTube videos dynamically
    try {
      const youtubeService = new YouTubeService();
      const youtubeVideos = await youtubeService.getHistoryLegendsLatestVideos();
      if (youtubeVideos && youtubeVideos.length > 0) {
        // Convert YouTubeVideo format to YouTubeEmbed format
        data.youtubeVideos = youtubeVideos.map(video => ({
          title: video.title,
          youtube_id: video.id,
          channel_name: 'History Legends'
        }));
      }
    } catch (error) {
      console.warn('Failed to load YouTube videos:', error);
      // Keep empty array if YouTube loading fails
    }
    
    // Calculate grand totals from monthly historical data
    // Date range: February 24, 2022 until current month
    const startDate = new Date('2022-02-24');
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let ukraineGrandTotal = 0;
    let russiaGrandTotal = 0;
    
    // Calculate Ukraine grand total from monthly data
    if (data.ukraineHistorical && data.ukraineHistorical.length > 0) {
      ukraineGrandTotal = data.ukraineHistorical
        .filter(item => {
          const [year, month] = item.date.split('-');
          const itemDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          return itemDate >= startDate && itemDate <= endDate;
        })
        .reduce((total, item) => total + (item.casualties || 0), 0);
    }
    
    // Calculate Russia grand total from monthly data
    if (data.russiaHistorical && data.russiaHistorical.length > 0) {
      russiaGrandTotal = data.russiaHistorical
        .filter(item => {
          const [year, month] = item.date.split('-');
          const itemDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          return itemDate >= startDate && itemDate <= endDate;
        })
        .reduce((total, item) => total + (item.casualties || 0), 0);
    }
    
    // Update the totals with grand totals from monthly data
    if (ukraineGrandTotal > 0) {
      data.ukraine.total_losses = ukraineGrandTotal;
    }
    
    if (russiaGrandTotal > 0) {
      data.russia.total_losses = russiaGrandTotal;
    }
    
    // Update last updated timestamp
    data.lastUpdated = new Date().toISOString();
    
    return data;
  } catch (error) {
    console.warn('Could not load casualty data from blob, using fallback data:', error);
    return fallbackData;
  }
}
