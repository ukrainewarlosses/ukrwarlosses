import { loadCasualtyDataFromBlob } from './blobDataLoader';
import { loadCasualtyData } from './dataLoader';
import { ScrapedData } from '@/types';

export async function loadCasualtyDataHybrid(): Promise<ScrapedData> {
  // Always use blob storage in production builds to avoid timeout issues
  const isProduction = process.env.NODE_ENV === 'production';
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
  const hasBlobUrls = process.env.UKRAINE_SOLDIERS_BLOB_URL && 
                     process.env.UKRAINE_MONTHLY_BLOB_URL && 
                     process.env.RUSSIA_MONTHLY_BLOB_URL;

  if (isProduction || isBuildTime || hasBlobUrls) {
    console.log('📦 Using blob storage for data loading');
    return await loadCasualtyDataFromBlob();
  } else {
    console.log('📁 Using local files for data loading');
    return await loadCasualtyData();
  }
}
