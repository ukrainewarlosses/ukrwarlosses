import fs from 'fs/promises';
import path from 'path';
import { CasualtyData, HistoricalData, ScrapedData } from '@/types';

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
    const dataPath = path.join(process.cwd(), 'src', 'data', 'casualties.json');
    const fileContent = await fs.readFile(dataPath, 'utf8');
    const data: ScrapedData = JSON.parse(fileContent);
    
    // Validate the data structure
    if (data.ukraine && data.russia && data.lastUpdated) {
      return data;
    }
    
    console.warn('Invalid data structure in casualties.json, using fallback');
    return fallbackData;
  } catch (error) {
    console.warn('Could not load casualties.json, using fallback data:', error);
    return fallbackData;
  }
}

export async function loadCasualtyDataClient(): Promise<ScrapedData> {
  try {
    // For client-side, we'll fetch from a public API endpoint or static file
    const response = await fetch('/api/data');
    if (response.ok) {
      return await response.json();
    }
    
    // Fallback to static file served by Next.js
    const staticResponse = await fetch('/data/casualties.json');
    if (staticResponse.ok) {
      return await staticResponse.json();
    }
    
    return fallbackData;
  } catch (error) {
    console.warn('Could not load casualty data on client:', error);
    return fallbackData;
  }
}

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
