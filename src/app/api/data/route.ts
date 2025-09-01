import { NextResponse } from 'next/server';
import { hardcodedCasualtyData } from '@/data/hardcoded-casualty-totals';
import { hardcodedChartData } from '@/data/hardcoded-chart-data';
import { hardcodedYouTubeData } from '@/data/hardcoded-youtube-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Return combined hardcoded data in the same format as before
    const data = {
      ukraine: hardcodedCasualtyData.ukraine,
      russia: hardcodedCasualtyData.russia,
      ukraineHistorical: hardcodedChartData.monthly.map(item => ({
        date: item.isoDate,
        casualties: item.ukraineTotal,
        confirmed: item.ukraineDeaths,
        unconfirmed: item.ukraineMissing
      })),
      russiaHistorical: hardcodedChartData.monthly.map(item => ({
        date: item.isoDate,
        casualties: item.russiaDeaths
      })),
      ukraineWeekly: hardcodedChartData.weekly.map(item => ({
        date: item.date,
        casualties: item.ukraineTotal,
        confirmed: item.ukraineDeaths,
        unconfirmed: item.ukraineMissing
      })),
      russiaWeekly: hardcodedChartData.weekly.map(item => ({
        date: item.date,
        casualties: item.russiaDeaths
      })),
      youtubeVideos: hardcodedYouTubeData.videos,
      lastUpdated: hardcodedCasualtyData.lastUpdated
    };
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600', // 30 min cache, 1 hour stale
      },
    });
  } catch (error) {
    console.error('Error serving hardcoded casualty data:', error);
    return NextResponse.json(
      { error: 'Failed to load casualty data' },
      { status: 500 }
    );
  }
}
