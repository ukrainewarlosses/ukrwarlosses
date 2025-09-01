import { promises as fs } from 'fs';
import path from 'path';
import { loadCasualtyDataHybrid } from '../src/lib/hybridDataLoader';
import { CasualtyData } from '../src/types';

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env') });

interface HardcodedCasualtyData {
  ukraine: CasualtyData;
  russia: CasualtyData;
  lastUpdated: string;
}

async function generateHardcodedCasualtyTotals(): Promise<HardcodedCasualtyData> {
  try {
    console.log('📊 Generating hardcoded casualty totals data...');
    
    let casualtyData: HardcodedCasualtyData;
    
    try {
      // Try to fetch latest data from hybrid loader
      const data = await loadCasualtyDataHybrid();
      casualtyData = {
        ukraine: data.ukraine,
        russia: data.russia,
        lastUpdated: new Date().toISOString()
      };
      console.log('✅ Successfully fetched casualty totals from data sources');
    } catch (error) {
      console.warn('⚠️ Failed to fetch from data sources, using fallback totals:', error);
      // Use fallback data if loading fails
      casualtyData = {
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
        lastUpdated: new Date().toISOString()
      };
    }
    
    console.log(`📊 Generated casualty totals:`, {
      ukraineTotal: casualtyData.ukraine.total_losses,
      russiaTotal: casualtyData.russia.total_losses,
      lastUpdated: casualtyData.lastUpdated
    });
    
    // Write the hardcoded data file (JSON)
    const outputPath = path.join(process.cwd(), 'src', 'data', 'hardcoded-casualty-totals.json');
    await fs.writeFile(outputPath, JSON.stringify(casualtyData, null, 2), 'utf8');
    
    console.log('✅ Hardcoded casualty totals saved to:', outputPath);
    
    // Also generate TypeScript file with the data
    const tsContent = `// Auto-generated hardcoded casualty totals data
// Last updated: ${new Date().toISOString()}

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

export const hardcodedCasualtyData: HardcodedCasualtyData = ${JSON.stringify(casualtyData, null, 2)};
`;
    
    const tsOutputPath = path.join(process.cwd(), 'src', 'data', 'hardcoded-casualty-totals.ts');
    await fs.writeFile(tsOutputPath, tsContent, 'utf8');
    
    console.log('✅ TypeScript hardcoded casualty totals saved to:', tsOutputPath);
    
    return casualtyData;
    
  } catch (error) {
    console.error('❌ Error generating hardcoded casualty totals:', error);
    throw error;
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('generate-hardcoded-casualty-totals')) {
  generateHardcodedCasualtyTotals()
    .then(() => {
      console.log('🎉 Casualty totals generation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to generate casualty totals:', error);
      process.exit(1);
    });
}

export { generateHardcodedCasualtyTotals };
