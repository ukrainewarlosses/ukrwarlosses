export interface CasualtyData {
  country: 'russia' | 'ukraine';
  total_losses: number;
  dead?: number;
  missing?: number;
  prisoners?: number;
  last_updated: string;
  source_url: string;
}

export interface HistoricalData {
  date: string;
  casualties: number;
  confirmed?: number;
  unconfirmed?: number;
}

export interface CountryData {
  current: CasualtyData;
  historical: HistoricalData[];
}

export interface ChartProps {
  ukraineHistorical: HistoricalData[];
  russiaHistorical: HistoricalData[];
  ukraineWeekly?: HistoricalData[];
  russiaWeekly?: HistoricalData[];
}

export interface YouTubeEmbed {
  title: string;
  youtube_id: string;
  channel_name: string;
}

export interface StatsCardProps {
  country: 'russia' | 'ukraine';
  casualties: number;
  title: string;
  breakdown?: {
    dead?: number;
    missing?: number;
    prisoners?: number;
  };
}

export interface AdBannerProps {
  size: 'header' | 'content' | 'mobile' | 'footer';
  adSlot: string;
}

export interface VideoCardProps {
  video: YouTubeEmbed;
}

export interface CasualtyEntry {
  name: string;
  birthDate?: string;
  deathDate?: string;
  location?: string;
  isEstimated?: boolean; // Death date in parentheses indicates uncertainty
}

export interface ScrapedData {
  ukraine: CasualtyData;
  russia: CasualtyData;
  ukraineHistorical: HistoricalData[];
  russiaHistorical: HistoricalData[];
  ukraineWeekly?: HistoricalData[];
  russiaWeekly?: HistoricalData[];
  youtubeVideos: YouTubeEmbed[];
  lastUpdated: string;
}

export interface ScrapingConfig {
  maxPages?: number;
  delayBetweenRequests?: number;
  retryAttempts?: number;
  enableCaching?: boolean;
  incrementalUpdate?: boolean;
}
