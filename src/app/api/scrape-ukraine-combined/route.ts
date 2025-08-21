import { NextRequest, NextResponse } from 'next/server';
import { createLostArmourCombinedScraper } from '@/lib/lostarmour-combined-scraper';

export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const delayMs = parseInt(searchParams.get('delayMs') || '1500', 10);
    const testMode = searchParams.get('test') === 'true';
    
    console.log('🚀 Starting Lost Armour Combined Ukraine scraper...');
    console.log(`⚙️  Config: delayMs=${delayMs}, testMode=${testMode}`);
    
    const scraper = createLostArmourCombinedScraper({
      delayBetweenRequests: delayMs,
      maxRetries: 3,
      enableCaching: true,
      testMode
    });
    
    // Scrape both deaths and missing persons
    const combinedRecords = await scraper.scrapeAllData();
    
    // Generate summary
    scraper.generateSummary(combinedRecords);
    
    // Save combined data
    const savedPath = await scraper.saveToFile(combinedRecords);
    
    console.log(`✅ Combined scraping completed: ${combinedRecords.length} total records`);
    
    return NextResponse.json({
      success: true,
      message: 'Lost Armour Combined Ukraine scraping completed successfully',
      totalRecords: combinedRecords.length,
      deaths: combinedRecords.filter(r => r.recordType === 'death').length,
      missing: combinedRecords.filter(r => r.recordType === 'missing').length,
      savedPath,
      testMode,
      timestamp: new Date().toISOString(),
      sampleRecords: {
        death: combinedRecords.find(r => r.recordType === 'death') || null,
        missing: combinedRecords.find(r => r.recordType === 'missing') || null
      }
    });
    
  } catch (error) {
    console.error('❌ Combined scraping failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Combined scraping failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
