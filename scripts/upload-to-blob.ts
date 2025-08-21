#!/usr/bin/env tsx

import { put } from '@vercel/blob';
import * as fs from 'fs/promises';
import * as path from 'path';



async function uploadFileToBlob(filePath: string, blobName: string) {
  try {
    console.log(`📤 Uploading ${filePath} to blob storage as ${blobName}...`);
    
    const fileContent = await fs.readFile(filePath);
    const result = await put(blobName, fileContent, {
      access: 'public',
      contentType: 'application/json'
    });
    
    console.log(`✅ Uploaded ${blobName}: ${result.url}`);
    console.log(`   Size: ${(fileContent.length / 1024 / 1024).toFixed(2)} MB`);
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to upload ${blobName}:`, error);
    throw error;
  }
}

async function uploadDataFiles() {
  console.log('🚀 Starting upload of data files to Vercel Blob Storage...\n');
  
  const uploads = [
    {
      filePath: 'src/data/ukraine/soldiers-raw.json',
      blobName: 'ukraine-soldiers-raw.json',
      envVar: 'UKRAINE_SOLDIERS_BLOB_URL'
    },
    {
      filePath: 'src/data/ukraine/monthly-raw_2025-08-21.json',
      blobName: 'ukraine-monthly-raw.json',
      envVar: 'UKRAINE_MONTHLY_BLOB_URL'
    },
    {
      filePath: 'src/data/russia/monthly_2025-08-21.json',
      blobName: 'russia-monthly.json',
      envVar: 'RUSSIA_MONTHLY_BLOB_URL'
    },
    {
      filePath: 'src/data/ukraine/weekly-raw_2025-08-21.json',
      blobName: 'ukraine-weekly-raw.json',
      envVar: 'UKRAINE_WEEKLY_BLOB_URL'
    },
    {
      filePath: 'src/data/russia/weekly_2025-08-21.json',
      blobName: 'russia-weekly.json',
      envVar: 'RUSSIA_WEEKLY_BLOB_URL'
    }
  ];
  
  const results: Record<string, string> = {};
  
  for (const upload of uploads) {
    try {
      const result = await uploadFileToBlob(upload.filePath, upload.blobName);
      results[upload.envVar] = result.url;
    } catch (error) {
      console.error(`Failed to upload ${upload.filePath}`);
    }
  }
  
  console.log('\n📋 Environment variables to add to your .env file:');
  console.log('==================================================');
  
  for (const [envVar, url] of Object.entries(results)) {
    console.log(`${envVar}=${url}`);
  }
  
  console.log('\n💡 Add these environment variables to your Vercel project settings');
  console.log('   or to your .env.local file for local development.');
  
  return results;
}

// Run the upload
uploadDataFiles().catch(console.error);
