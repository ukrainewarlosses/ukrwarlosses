import { NextRequest, NextResponse } from 'next/server';
import { createRussiaCasualtiesScraper } from '@/lib/russia-casualties-scraper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const maxPagesParam = url.searchParams.get('maxPages');
    const delayParam = url.searchParams.get('delayMs');

    const maxPages = maxPagesParam ? parseInt(maxPagesParam, 10) : undefined;
    const delayMs = delayParam ? parseInt(delayParam, 10) : 2000;

    console.log(`Russian scraper starting: maxPages=${maxPages || 'unlimited'}, delayMs=${delayMs}`);

    // Create scraper with configuration
    const scraper = createRussiaCasualtiesScraper({
      maxPages,
      delayBetweenRequests: delayMs,
      maxRetries: 3,
      enableCaching: true
    });

    // Scrape all pages
    const allRecords = await scraper.scrapeAllPages();

    // Save to file
    const outputPath = await scraper.saveToFile(allRecords);

    return NextResponse.json({
      success: true,
      totalRecords: allRecords.length,
      data: allRecords.slice(0, 5), // Return first 5 records as sample
      outputPath,
      message: `Successfully scraped ${allRecords.length} records from svo.rf.gd`
    });

  } catch (error) {
    console.error('Russian scraper error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to scrape Russian casualties'
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}