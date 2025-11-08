import { promises as fs } from 'fs';
import path from 'path';
import { CasualtyData } from '../src/types';

interface HardcodedCasualtyData {
  ukraine: CasualtyData;
  russia: CasualtyData;
  lastUpdated: string;
}

async function loadRawData() {
  const dataDir = path.join(process.cwd(), 'src', 'data');
  
  // Load Ukraine deduplicated soldiers data
  const ukraineSoldiersPath = path.join(dataDir, 'ukraine', 'soldiers.json');
  let ukraineSoldiers: any[] = [];
  try {
    ukraineSoldiers = JSON.parse(await fs.readFile(ukraineSoldiersPath, 'utf8'));
  } catch (error) {
    console.warn('⚠️ Could not load Ukraine soldiers.json');
  }
  
  // Load Russia deduplicated casualties data
  const russiaCasualtiesPath = path.join(dataDir, 'russia', 'casualties.json');
  let russiaCasualties: any[] = [];
  try {
    russiaCasualties = JSON.parse(await fs.readFile(russiaCasualtiesPath, 'utf8'));
  } catch (error) {
    console.warn('⚠️ Could not load Russia casualties.json');
  }
  
  // Also load monthly data for breakdown
  const ukraineDir = path.join(dataDir, 'ukraine');
  const ukraineFiles = await fs.readdir(ukraineDir);
  const ukraineMonthlyFile = ukraineFiles
    .filter(f => f.startsWith('monthly-deduplicated_') && f.endsWith('.json'))
    .sort()
    .pop();
  
  const russiaDir = path.join(dataDir, 'russia');
  const russiaFiles = await fs.readdir(russiaDir);
  const russiaMonthlyFile = russiaFiles
    .filter(f => f.startsWith('monthly_') && f.endsWith('.json'))
    .sort()
    .pop();
  
  const ukraineMonthlyData: Record<string, { deaths: number; missing: number; total: number }> = ukraineMonthlyFile 
    ? JSON.parse(await fs.readFile(path.join(ukraineDir, ukraineMonthlyFile), 'utf8'))
    : {};
    
  const russiaMonthlyData: Record<string, { deaths: number; total: number }> = russiaMonthlyFile
    ? JSON.parse(await fs.readFile(path.join(russiaDir, russiaMonthlyFile), 'utf8'))
    : {};
  
  return { ukraineSoldiers, russiaCasualties, ukraineMonthlyData, russiaMonthlyData };
}

async function generateHardcodedCasualtyTotals(): Promise<HardcodedCasualtyData> {
  try {
    console.log('📊 Generating hardcoded casualty totals data...');
    
    // Load raw data and calculate totals
    const { ukraineSoldiers, russiaCasualties, ukraineMonthlyData, russiaMonthlyData } = await loadRawData();
    
    // Calculate Ukraine totals from ALL deduplicated soldiers (not just those with dates)
    const ukraineTotal = ukraineSoldiers.length;
    const ukraineDeaths = ukraineSoldiers.filter((r: any) => r.recordType === 'death').length;
    const ukraineMissing = ukraineSoldiers.filter((r: any) => r.recordType === 'missing').length;
    
    // Calculate Russia totals from deduplicated file (monthly data may include duplicates)
    const russiaTotal = russiaCasualties.length;
    
    const casualtyData: HardcodedCasualtyData = {
      ukraine: {
        country: 'ukraine',
        total_losses: ukraineTotal,
        dead: ukraineDeaths,
        missing: ukraineMissing,
        prisoners: 0,
        last_updated: new Date().toISOString(),
        source_url: 'https://lostarmour.info/ukr200'
      },
      russia: {
        country: 'russia',
        total_losses: russiaTotal,
        last_updated: new Date().toISOString(),
        source_url: 'https://svo.rf.gd'
      },
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`📊 Generated casualty totals:`, {
      ukraineTotal: casualtyData.ukraine.total_losses,
      ukraineDeaths: casualtyData.ukraine.dead,
      ukraineMissing: casualtyData.ukraine.missing,
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
