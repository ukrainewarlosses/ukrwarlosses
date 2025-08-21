import { NextRequest, NextResponse } from 'next/server';
import { createLostArmourUkraineScraper } from '@/lib/lostarmour-ukraine-scraper';

export async function POST(request: NextRequest) {
  try {
    // Check for authorization header (in production, this should be properly authenticated)
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && !authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Starting Lost Armour Ukraine scraper...');
    
    const scraper = createLostArmourUkraineScraper({
      delayBetweenRequests: 1000,
      maxRetries: 3,
      enableCaching: true
    });

    // Scrape all Ukrainian letters
    const records = await scraper.scrapeAllLetters();
    
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
      data: {
        totalRecords: records.length,
        standardRecords: standardRecords.length,
        savedPath,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in scrape API:', error);
    return NextResponse.json(
      { error: 'Scraping failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint for checking scrape status or triggering manual scrape
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'status') {
      return NextResponse.json({
        success: true,
        message: 'Scraper is ready',
        lastRun: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Use POST to trigger scraping, GET with ?action=status to check status'
    });
  } catch (error) {
    console.error('Error in scrape GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
