import { loadCasualtyDataFromBlob } from './blobDataLoader';
import { ScrapedData } from '@/types';

export async function loadCasualtyDataHybrid(): Promise<ScrapedData> {
  // Always use blob storage to avoid serverless function size limits and ensure consistency
  console.log('📦 Using blob storage for data loading');
  return await loadCasualtyDataFromBlob();
}
