#!/usr/bin/env node

/**
 * Simple script to update hardcoded casualty totals
 * This reads from the local data files and generates hardcoded totals
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

async function generateHardcodedCasualtyTotals() {
  try {
    console.log('📊 Generating hardcoded casualty totals from local data...');
    
    // Use current snapshot totals, not historical sums
    // These should represent the current state, not cumulative historical data
    let ukraineTotal = 158892; // fallback - current total losses
    let russiaTotal = 121507; // fallback - current total losses
    
    try {
      // Try to read current totals from soldiers.json if available
      const ukraineSoldiersFile = path.join(process.cwd(), 'src', 'data', 'ukraine', 'soldiers.json');
      if (fs.existsSync(ukraineSoldiersFile)) {
        const ukraineSoldiers = JSON.parse(fs.readFileSync(ukraineSoldiersFile, 'utf8'));
        if (ukraineSoldiers.ukraine && ukraineSoldiers.ukraine.total_losses) {
          ukraineTotal = ukraineSoldiers.ukraine.total_losses;
          console.log(`✅ Loaded current Ukraine total from soldiers.json: ${ukraineTotal}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not load current Ukraine totals, using fallback');
    }
    
    try {
      // Try to read current totals from casualties.json if available  
      const russiaCasualtiesFile = path.join(process.cwd(), 'src', 'data', 'russia', 'casualties.json');
      if (fs.existsSync(russiaCasualtiesFile)) {
        const russiaCasualties = JSON.parse(fs.readFileSync(russiaCasualtiesFile, 'utf8'));
        if (russiaCasualties.russia && russiaCasualties.russia.total_losses) {
          russiaTotal = russiaCasualties.russia.total_losses;
          console.log(`✅ Loaded current Russia total from casualties.json: ${russiaTotal}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not load current Russia totals, using fallback');
    }
    
    const casualtyData = {
      ukraine: {
        country: 'ukraine',
        total_losses: ukraineTotal,
        dead: Math.floor(ukraineTotal * 0.5), // Approximate breakdown
        missing: Math.floor(ukraineTotal * 0.47),
        prisoners: Math.floor(ukraineTotal * 0.03),
        last_updated: new Date().toISOString(),
        source_url: 'https://ualosses.org/en/soldiers/'
      },
      russia: {
        country: 'russia',
        total_losses: russiaTotal,
        last_updated: new Date().toISOString(),
        source_url: 'https://en.zona.media/article/2025/08/01/casualties_eng-trl'
      },
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`📊 Generated casualty totals:`, {
      ukraineTotal: casualtyData.ukraine.total_losses,
      russiaTotal: casualtyData.russia.total_losses,
      lastUpdated: casualtyData.lastUpdated
    });
    
    // Generate TypeScript file with the data
    const tsContent = `// Hardcoded casualty totals data
// This will be updated by the cron job when new data is scraped
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
    fs.writeFileSync(tsOutputPath, tsContent, 'utf8');
    
    console.log('✅ TypeScript hardcoded casualty totals saved to:', tsOutputPath);
    
    // Also save JSON version
    const jsonOutputPath = path.join(process.cwd(), 'src', 'data', 'hardcoded-casualty-totals.json');
    fs.writeFileSync(jsonOutputPath, JSON.stringify(casualtyData, null, 2), 'utf8');
    
    console.log('✅ JSON hardcoded casualty totals saved to:', jsonOutputPath);
    
    return casualtyData;
    
  } catch (error) {
    console.error('❌ Error generating hardcoded casualty totals:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
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

module.exports = { generateHardcodedCasualtyTotals };
