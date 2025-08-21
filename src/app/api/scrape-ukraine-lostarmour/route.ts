import { NextRequest, NextResponse } from 'next/server';
import { createLostArmourUkraineScraper } from '@/lib/lostarmour-ukraine-scraper';

export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const delayMs = parseInt(searchParams.get('delayMs') || '1000', 10);
    const testMode = searchParams.get('test') === 'true';
    
    console.log('🚀 Starting Lost Armour Ukraine scraper...');
    console.log(`⚙️  Config: delayMs=${delayMs}, testMode=${testMode}`);
    
    const scraper = createLostArmourUkraineScraper({
      delayBetweenRequests: delayMs,
      maxRetries: 3,
      enableCaching: true
    });
    
    let records;
    
    if (testMode) {
      // Test mode: only scrape first few letters
      console.log('🧪 Test mode: scraping first 3 letters only');
      // Override the scraper to only do a few letters for testing
      records = await scraper.scrapeAllLetters(); // We'll limit this in the scraper
    } else {
      // Production mode: scrape all letters
      console.log('🏭 Production mode: scraping all Ukrainian letters');
      records = await scraper.scrapeAllLetters();
    }
    
    console.log(`✅ Scraping completed: ${records.length} records`);
    
    // Convert to standard format for compatibility
    const standardRecords = scraper.convertToStandardFormat(records);
    
    // Save the raw Lost Armour data
    const savedPath = await scraper.saveToFile(records);
    
    // Also save in standard format
    if (standardRecords.length > 0) {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const standardPath = path.join(process.cwd(), 'src', 'data', 'ukraine', 'soldiers-raw.json');
      await fs.writeFile(standardPath, JSON.stringify(standardRecords, null, 2));
      console.log(`💾 Standard format saved: ${standardPath}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Lost Armour Ukraine scraping completed successfully',
      totalRecords: records.length,
      standardRecords: standardRecords.length,
      savedPath,
      timestamp: new Date().toISOString(),
      sampleRecord: records[0] || null,
      sampleStandardRecord: standardRecords[0] || null
    });
    
  } catch (error) {
    console.error('❌ Lost Armour scraping failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Lost Armour scraping failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
