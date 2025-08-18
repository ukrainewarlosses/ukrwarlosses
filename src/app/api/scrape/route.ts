import { NextRequest, NextResponse } from 'next/server';
import { createComprehensiveScraper } from '@/lib/comprehensive-scraper';

export async function POST(request: NextRequest) {
  try {
    // Check for authorization header (in production, this should be properly authenticated)
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && !authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Debug environment variables
    console.log('🔍 DEBUG: Environment check');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('YOUTUBE_API_KEY available:', !!process.env.YOUTUBE_API_KEY);
    console.log('YOUTUBE_API_KEY length:', process.env.YOUTUBE_API_KEY ? process.env.YOUTUBE_API_KEY.length : 0);

    const scraper = createComprehensiveScraper();

    console.log('Starting daily war losses scraping...');

    // Scrape all data and save to static JSON
    const scrapedData = await scraper.scrapeAll();

    if (!scrapedData) {
      return NextResponse.json({
        success: false,
        message: 'Failed to scrape war losses data',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Daily war losses scraping completed successfully',
      data: {
        ukraine: scrapedData.ukraine.total_losses,
        russia: scrapedData.russia.total_losses,
        historicalPoints: scrapedData.ukraineHistorical.length,
        lastUpdated: scrapedData.lastUpdated
      },
      timestamp: new Date().toISOString()
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
