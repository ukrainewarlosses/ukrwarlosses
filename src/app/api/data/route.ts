import { NextResponse } from 'next/server';
import { loadCasualtyDataHybrid } from '@/lib/hybridDataLoader';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await loadCasualtyDataHybrid();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600', // 30 min cache, 1 hour stale
      },
    });
  } catch (error) {
    console.error('Error serving casualty data:', error);
    return NextResponse.json(
      { error: 'Failed to load casualty data' },
      { status: 500 }
    );
  }
}
