#!/usr/bin/env tsx

/**
 * Monthly Data Upload Script
 * 
 * This script uploads the latest scraped data to Vercel Blob storage
 * with proper naming conventions for automatic discovery.
 * 
 * Usage: npm run upload-monthly-data
 */

import { put } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const DATA_DIR = path.join(process.cwd(), 'src', 'data');

// File patterns and their blob naming conventions
const UPLOAD_CONFIG = [
  {
    localPath: 'russia/casualties.json',
    blobName: `russia-all-casualties_${getCurrentDate()}.json`,
    description: 'Russia all casualties data'
  },
  {
    localPath: 'ukraine/soldiers.json',
    blobName: `ukraine-all-casualties_${getCurrentDate()}.json`,
    description: 'Ukraine all casualties data'
  },
  {
    localPath: 'ukraine/monthly-deduplicated_2025-08-21.json',
    blobName: `ukraine-monthly-casualties-deduped_${getCurrentDate()}.json`,
    description: 'Ukraine monthly casualties (deduplicated)'
  },
  {
    localPath: 'russia/monthly-deduplicated_2025-08-20.json',
    blobName: `russia-monthly-casualties-deduped_${getCurrentDate()}.json`,
    description: 'Russia monthly casualties (deduplicated)'
  },
  {
    localPath: 'ukraine/weekly-deduplicated_2025-08-21.json',
    blobName: `ukraine-weekly-casualties-deduped_${getCurrentDate()}.json`,
    description: 'Ukraine weekly casualties (deduplicated)'
  },
  {
    localPath: 'russia/weekly_2025-08-21.json',
    blobName: `russia-weekly-casualties-deduped_${getCurrentDate()}.json`,
    description: 'Russia weekly casualties (deduplicated)'
  }
];

function getCurrentDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD format
}

async function uploadFile(localPath: string, blobName: string, description: string): Promise<void> {
  try {
    const fullLocalPath = path.join(DATA_DIR, localPath);
    
    // Check if file exists
    try {
      await fs.access(fullLocalPath);
    } catch {
      console.log(`⚠️  Skipping ${description}: File not found at ${fullLocalPath}`);
      return;
    }

    console.log(`📤 Uploading ${description}...`);
    
    const fileBuffer = await fs.readFile(fullLocalPath);
    const { url } = await put(blobName, fileBuffer, {
      access: 'public',
      token: BLOB_TOKEN
    });

    console.log(`✅ Successfully uploaded ${description}`);
    console.log(`   📍 URL: ${url}`);
    console.log(`   📁 Blob name: ${blobName}`);
    
  } catch (error) {
    console.error(`❌ Failed to upload ${description}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting monthly data upload to Vercel Blob...');
  console.log(`📅 Date: ${getCurrentDate()}`);
  console.log('');

  if (!BLOB_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN environment variable is required');
    process.exit(1);
  }

  const results = {
    success: 0,
    failed: 0,
    skipped: 0
  };

  for (const config of UPLOAD_CONFIG) {
    try {
      await uploadFile(config.localPath, config.blobName, config.description);
      results.success++;
    } catch (error) {
      results.failed++;
    }
  }

  console.log('');
  console.log('📊 Upload Summary:');
  console.log(`   ✅ Successful: ${results.success}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⚠️  Skipped: ${results.skipped}`);
  console.log('');
  console.log('🎉 Monthly data upload completed!');
  console.log('');
  console.log('💡 The application will automatically discover and use these new files.');
  console.log('   No manual configuration changes are needed.');
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}
