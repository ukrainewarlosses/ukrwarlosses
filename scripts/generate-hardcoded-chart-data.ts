import { promises as fs } from 'fs';
import path from 'path';

interface MonthlyData {
  [key: string]: {
    deaths: number;
    missing?: number;
    total: number;
  };
}

interface WeeklyData {
  [key: string]: {
    deaths: number;
    missing?: number;
    total: number;
  };
}

interface DailyData {
  [key: string]: {
    deaths: number;
    missing?: number;
    total: number;
  };
}

interface ChartData {
  date: string;
  isoDate: string;
  ukraineTotal: number;
  ukraineDeaths: number;
  ukraineMissing: number;
  ukraineTotalCumulative: number;
  russiaDeaths: number;
  russiaTotalCumulative: number;
}

async function loadLatestDataFiles() {
  const dataDir = path.join(process.cwd(), 'src', 'data');
  
  // Find latest Ukraine monthly data
  const ukraineDir = path.join(dataDir, 'ukraine');
  const ukraineFiles = await fs.readdir(ukraineDir);
  const ukraineMonthlyFile = ukraineFiles
    .filter(f => f.startsWith('monthly-deduplicated_') && f.endsWith('.json'))
    .sort()
    .pop();
  
  const ukraineWeeklyFile = ukraineFiles
    .filter(f => f.startsWith('weekly-deduplicated_') && f.endsWith('.json'))
    .sort()
    .pop();
    
  const ukraineDailyFile = ukraineFiles
    .filter(f => f.startsWith('daily-raw_') && f.endsWith('.json'))
    .sort()
    .pop();
    
  // Find latest Russia monthly data
  const russiaDir = path.join(dataDir, 'russia');
  const russiaFiles = await fs.readdir(russiaDir);
  const russiaMonthlyFile = russiaFiles
    .filter(f => f.startsWith('monthly_') && f.endsWith('.json'))
    .sort()
    .pop();
    
  const russiaWeeklyFile = russiaFiles
    .filter(f => f.startsWith('weekly_') && f.endsWith('.json'))
    .sort()
    .pop();
    
  const russiaDailyFile = russiaFiles
    .filter(f => f.startsWith('daily_') && f.endsWith('.json'))
    .sort()
    .pop();

  console.log('Loading data files:', {
    ukraineMonthly: ukraineMonthlyFile,
    ukraineWeekly: ukraineWeeklyFile,
    ukraineDaily: ukraineDailyFile,
    russiaMonthly: russiaMonthlyFile,
    russiaWeekly: russiaWeeklyFile,
    russiaDaily: russiaDailyFile
  });

  // Load the data
  const ukraineMonthlyData: MonthlyData = ukraineMonthlyFile 
    ? JSON.parse(await fs.readFile(path.join(ukraineDir, ukraineMonthlyFile), 'utf8'))
    : {};
    
  const ukraineWeeklyData: WeeklyData = ukraineWeeklyFile
    ? JSON.parse(await fs.readFile(path.join(ukraineDir, ukraineWeeklyFile), 'utf8'))
    : {};
    
  const ukraineDailyData: DailyData = ukraineDailyFile
    ? JSON.parse(await fs.readFile(path.join(ukraineDir, ukraineDailyFile), 'utf8'))
    : {};

  const russiaMonthlyData: MonthlyData = russiaMonthlyFile
    ? JSON.parse(await fs.readFile(path.join(russiaDir, russiaMonthlyFile), 'utf8'))
    : {};
    
  const russiaWeeklyData: WeeklyData = russiaWeeklyFile
    ? JSON.parse(await fs.readFile(path.join(russiaDir, russiaWeeklyFile), 'utf8'))
    : {};
    
  const russiaDailyData: DailyData = russiaDailyFile
    ? JSON.parse(await fs.readFile(path.join(russiaDir, russiaDailyFile), 'utf8'))
    : {};

  return {
    ukraineMonthly: ukraineMonthlyData,
    ukraineWeekly: ukraineWeeklyData,
    ukraineDaily: ukraineDailyData,
    russiaMonthly: russiaMonthlyData,
    russiaWeekly: russiaWeeklyData,
    russiaDaily: russiaDailyData
  };
}

function processMonthlyData(ukraineData: MonthlyData, russiaData: MonthlyData): ChartData[] {
  const dataMap: { [key: string]: ChartData } = {};
  
  // Process Ukraine data
  Object.entries(ukraineData).forEach(([dateKey, item]) => {
    const [year, month] = dateKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const displayDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const isoDate = `${year}-${month}-01`;
    
    dataMap[displayDate] = {
      date: displayDate,
      isoDate,
      ukraineTotal: item.total || 0,
      ukraineDeaths: item.deaths || 0,
      ukraineMissing: item.missing || 0,
      ukraineTotalCumulative: 0,
      russiaDeaths: 0,
      russiaTotalCumulative: 0
    };
  });
  
  // Process Russia data
  Object.entries(russiaData).forEach(([dateKey, item]) => {
    const [year, month] = dateKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const displayDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    if (!dataMap[displayDate]) {
      const isoDate = `${year}-${month}-01`;
      dataMap[displayDate] = {
        date: displayDate,
        isoDate,
        ukraineTotal: 0,
        ukraineDeaths: 0,
        ukraineMissing: 0,
        ukraineTotalCumulative: 0,
        russiaDeaths: 0,
        russiaTotalCumulative: 0
      };
    }
    
    dataMap[displayDate].russiaDeaths = item.deaths || item.total || 0;
  });
  
  // Convert to array and sort
  const processedData = Object.values(dataMap);
  
  // Filter out future months
  const now = new Date();
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const filtered = processedData.filter(p => {
    const d = new Date(p.isoDate);
    return d < cutoffDate;
  });
  
  const sortedData = filtered.sort((a, b) => {
    const [monthA, yearA] = a.date.split(' ');
    const [monthB, yearB] = b.date.split(' ');
    const dateA = new Date(monthA + ' 1, ' + yearA);
    const dateB = new Date(monthB + ' 1, ' + yearB);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Calculate cumulative totals
  let ukraineTotalCum = 0;
  let russiaTotalCum = 0;
  const finalData = sortedData.map(item => {
    ukraineTotalCum += item.ukraineTotal;
    russiaTotalCum += item.russiaDeaths;
    return {
      ...item,
      ukraineTotalCumulative: ukraineTotalCum,
      russiaTotalCumulative: russiaTotalCum
    };
  });
  
  return finalData;
}

function processWeeklyData(ukraineData: WeeklyData, russiaData: WeeklyData): ChartData[] {
  const dataMap: { [key: string]: ChartData } = {};
  
  // Process Ukraine data
  Object.entries(ukraineData).forEach(([dateKey, item]) => {
    dataMap[dateKey] = {
      date: dateKey,
      isoDate: dateKey,
      ukraineTotal: item.total || 0,
      ukraineDeaths: item.deaths || 0,
      ukraineMissing: item.missing || 0,
      ukraineTotalCumulative: 0,
      russiaDeaths: 0,
      russiaTotalCumulative: 0
    };
  });
  
  // Process Russia data
  Object.entries(russiaData).forEach(([dateKey, item]) => {
    if (!dataMap[dateKey]) {
      dataMap[dateKey] = {
        date: dateKey,
        isoDate: dateKey,
        ukraineTotal: 0,
        ukraineDeaths: 0,
        ukraineMissing: 0,
        ukraineTotalCumulative: 0,
        russiaDeaths: 0,
        russiaTotalCumulative: 0
      };
    }
    
    dataMap[dateKey].russiaDeaths = item.deaths || item.total || 0;
  });
  
  // Convert to array and sort
  const processedData = Object.values(dataMap);
  
  // Filter out current week and future weeks
  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const currentWeekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  const currentWeekKey = `${currentYear}-W${String(currentWeekNumber).padStart(2, '0')}`;
  
  const filtered = processedData.filter(p => p.date < currentWeekKey);
  
  const sortedData = filtered.sort((a, b) => a.date.localeCompare(b.date));
  
  // Calculate cumulative totals
  let ukraineTotalCum = 0;
  let russiaTotalCum = 0;
  const finalData = sortedData.map(item => {
    ukraineTotalCum += item.ukraineTotal;
    russiaTotalCum += item.russiaDeaths;
    return {
      ...item,
      ukraineTotalCumulative: ukraineTotalCum,
      russiaTotalCumulative: russiaTotalCum
    };
  });
  
  return finalData;
}

function processDailyData(ukraineDaily: DailyData, russiaDaily: DailyData): ChartData[] {
  const dataMap: { [key: string]: ChartData } = {};
  
  // Process Ukraine daily data
  Object.entries(ukraineDaily).forEach(([dateKey, item]) => {
    dataMap[dateKey] = {
      date: dateKey,
      isoDate: dateKey,
      ukraineTotal: item.total || 0,
      ukraineDeaths: item.deaths || 0,
      ukraineMissing: item.missing || 0,
      ukraineTotalCumulative: 0,
      russiaDeaths: 0,
      russiaTotalCumulative: 0
    };
  });
  
  // Process Russia daily data
  Object.entries(russiaDaily).forEach(([dateKey, item]) => {
    if (!dataMap[dateKey]) {
      dataMap[dateKey] = {
        date: dateKey,
        isoDate: dateKey,
        ukraineTotal: 0,
        ukraineDeaths: 0,
        ukraineMissing: 0,
        ukraineTotalCumulative: 0,
        russiaDeaths: 0,
        russiaTotalCumulative: 0
      };
    }
    
    dataMap[dateKey].russiaDeaths = item.deaths || item.total || 0;
  });
  
  // Convert to array and sort
  const processedData = Object.values(dataMap);
  
  // Filter out current day and future days
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  const filtered = processedData.filter(p => p.date < today);
  
  const sortedData = filtered.sort((a, b) => a.date.localeCompare(b.date));
  
  // Calculate cumulative totals
  let ukraineTotalCum = 0;
  let russiaTotalCum = 0;
  const finalData = sortedData.map(item => {
    ukraineTotalCum += item.ukraineTotal;
    russiaTotalCum += item.russiaDeaths;
    return {
      ...item,
      ukraineTotalCumulative: ukraineTotalCum,
      russiaTotalCumulative: russiaTotalCum
    };
  });
  
  return finalData;
}

async function generateHardcodedChartData() {
  try {
    console.log('🔄 Generating hardcoded chart data...');
    
    const data = await loadLatestDataFiles();
    
    const monthlyChartData = processMonthlyData(data.ukraineMonthly, data.russiaMonthly);
    const weeklyChartData = processWeeklyData(data.ukraineWeekly, data.russiaWeekly);
    const dailyChartData = processDailyData(data.ukraineDaily, data.russiaDaily);
    
    console.log(`📊 Generated chart data:`, {
      dailyDataPoints: dailyChartData.length,
      monthlyDataPoints: monthlyChartData.length,
      weeklyDataPoints: weeklyChartData.length,
      dailyRange: dailyChartData.length > 0 ? 
        `${dailyChartData[0]?.date} to ${dailyChartData[dailyChartData.length - 1]?.date}` : 'No data',
      monthlyRange: monthlyChartData.length > 0 ? 
        `${monthlyChartData[0]?.date} to ${monthlyChartData[monthlyChartData.length - 1]?.date}` : 'No data',
      weeklyRange: weeklyChartData.length > 0 ?
        `${weeklyChartData[0]?.date} to ${weeklyChartData[weeklyChartData.length - 1]?.date}` : 'No data'
    });
    
    const hardcodedData = {
      daily: dailyChartData,
      monthly: monthlyChartData,
      weekly: weeklyChartData,
      lastUpdated: new Date().toISOString()
    };
    
    // Write the hardcoded data file
    const outputPath = path.join(process.cwd(), 'src', 'data', 'hardcoded-chart-data.json');
    await fs.writeFile(outputPath, JSON.stringify(hardcodedData, null, 2), 'utf8');
    
    console.log('✅ Hardcoded chart data saved to:', outputPath);
    
    // Also generate TypeScript file with the data
    const tsContent = `// Auto-generated hardcoded chart data
// Last updated: ${new Date().toISOString()}

export interface ChartData {
  date: string;
  isoDate: string;
  ukraineTotal: number;
  ukraineDeaths: number;
  ukraineMissing: number;
  ukraineTotalCumulative: number;
  russiaDeaths: number;
  russiaTotalCumulative: number;
}

export interface HardcodedChartData {
  daily: ChartData[];
  monthly: ChartData[];
  weekly: ChartData[];
  lastUpdated: string;
}

export const hardcodedChartData: HardcodedChartData = ${JSON.stringify(hardcodedData, null, 2)};
`;
    
    const tsOutputPath = path.join(process.cwd(), 'src', 'data', 'hardcoded-chart-data.ts');
    await fs.writeFile(tsOutputPath, tsContent, 'utf8');
    
    console.log('✅ TypeScript hardcoded chart data saved to:', tsOutputPath);
    
    return hardcodedData;
    
  } catch (error) {
    console.error('❌ Error generating hardcoded chart data:', error);
    throw error;
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('generate-hardcoded-chart-data')) {
  generateHardcodedChartData()
    .then(() => {
      console.log('🎉 Chart data generation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to generate chart data:', error);
      process.exit(1);
    });
}

export { generateHardcodedChartData };
