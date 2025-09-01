// Hardcoded casualty totals data
// This will be updated by the cron job when new data is scraped
// Last updated: 2025-09-01T21:40:02.435Z

export interface CasualtyData {
  country: 'russia' | 'ukraine';
  total_losses: number;
  dead?: number;
  missing?: number;
  prisoners?: number;
  last_updated: string;
  source_url: string;
}

export interface HardcodedCasualtyData {
  ukraine: CasualtyData;
  russia: CasualtyData;
  lastUpdated: string;
}

export const hardcodedCasualtyData: HardcodedCasualtyData = {
  "ukraine": {
    "country": "ukraine",
    "total_losses": 158892,
    "dead": 79446,
    "missing": 74679,
    "prisoners": 4766,
    "last_updated": "2025-09-01T21:40:02.434Z",
    "source_url": "https://ualosses.org/en/soldiers/"
  },
  "russia": {
    "country": "russia",
    "total_losses": 121507,
    "last_updated": "2025-09-01T21:40:02.435Z",
    "source_url": "https://en.zona.media/article/2025/08/01/casualties_eng-trl"
  },
  "lastUpdated": "2025-09-01T21:40:02.435Z"
};
