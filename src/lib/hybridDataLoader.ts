import { loadCasualtyDataFromBlob } from './blobDataLoader';
import { loadCasualtyData } from './dataLoader';
import { ScrapedData } from '@/types';

export async function loadCasualtyDataHybrid(): Promise<ScrapedData> {
  // Check if we're in production or if blob URLs are configured
  const isProduction = process.env.NODE_ENV === 'production';
  const hasBlobUrls = process.env.UKRAINE_SOLDIERS_BLOB_URL && 
                     process.env.UKRAINE_MONTHLY_BLOB_URL && 
                     process.env.RUSSIA_MONTHLY_BLOB_URL;

  if (isProduction || hasBlobUrls) {
    console.log('📦 Using blob storage for data loading');
    return await loadCasualtyDataFromBlob();
  } else {
    console.log('📁 Using local files for data loading');
    return await loadCasualtyData();
  }
}
