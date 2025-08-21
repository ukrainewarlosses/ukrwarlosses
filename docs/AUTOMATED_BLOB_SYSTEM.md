# Automated Blob URL Discovery System

This document explains the automated system for dynamically discovering and using the latest data files from Vercel Blob storage.

## Overview

The application now automatically discovers and uses the latest data files from Vercel Blob storage without requiring manual configuration updates. This system ensures that:

1. **No local data files are used** - All data is loaded from Vercel Blob
2. **Automatic discovery** - The system finds the latest files based on naming patterns
3. **Fallback support** - Graceful degradation if blob discovery fails
4. **Caching** - URLs are cached to avoid repeated API calls

## How It Works

### 1. File Naming Convention

Data files follow a specific naming pattern that includes dates:

- `russia-all-casualties_YYYY-MM-DD.json` - Russia all casualties data
- `ukraine-all-casualties_YYYY-MM-DD.json` - Ukraine all casualties data
- `russia-monthly-casualties-deduped_YYYY-MM-DD.json` - Russia monthly casualties (deduplicated)
- `ukraine-monthly-casualties-deduped_YYYY-MM-DD.json` - Ukraine monthly casualties (deduplicated)
- `russia-weekly-casualties-deduped_YYYY-MM-DD.json` - Russia weekly casualties (deduplicated)
- `ukraine-weekly-casualties-deduped_YYYY-MM-DD.json` - Ukraine weekly casualties (deduplicated)

### 2. Discovery Process

The system uses the following priority order to find data files:

1. **Environment Variables** - Check for specific URLs in environment variables
2. **Blob API Discovery** - List all blobs and find the latest matching pattern
3. **Fallback URLs** - Use hardcoded fallback URLs if discovery fails

### 3. Caching

Discovered URLs are cached for 5 minutes to avoid repeated API calls and improve performance.

## Monthly Update Process

### Automated Upload Script

Use the provided script to upload new monthly data:

```bash
npm run upload-monthly-data
```

This script will:

1. Read the latest scraped data from `src/data/`
2. Upload files with current date in the filename
3. Maintain the naming convention for automatic discovery
4. Provide a summary of upload results

### Manual Upload Process

If you need to upload files manually:

1. **Prepare your data files** in the `src/data/` directory
2. **Use the Vercel CLI** to upload with proper naming:

```bash
# Upload with current date
vercel blob put src/data/russia/casualties.json --rw-token YOUR_TOKEN --name russia-all-casualties_2025-09-21.json
vercel blob put src/data/ukraine/soldiers.json --rw-token YOUR_TOKEN --name ukraine-all-casualties_2025-09-21.json

# Upload monthly data with date
vercel blob put src/data/ukraine/monthly-deduplicated_2025-08-21.json --rw-token YOUR_TOKEN --name ukraine-monthly-casualties-deduped_2025-09-21.json
vercel blob put src/data/russia/monthly-deduplicated_2025-08-20.json --rw-token YOUR_TOKEN --name russia-monthly-casualties-deduped_2025-09-21.json
```

## Configuration

### Environment Variables

You can override the automatic discovery by setting environment variables:

```env
CASUALTIES_BLOB_URL=https://your-blob-url.com/russia-all-casualties_2025-09-21.json
SOLDIERS_BLOB_URL=https://your-blob-url.com/ukraine-all-casualties_2025-09-21.json
UKRAINE_MONTHLY_BLOB_URL=https://your-blob-url.com/ukraine-monthly-casualties-deduped_2025-09-21.json
RUSSIA_MONTHLY_BLOB_URL=https://your-blob-url.com/russia-monthly-casualties-deduped_2025-09-21.json
UKRAINE_WEEKLY_BLOB_URL=https://your-blob-url.com/ukraine-weekly-casualties-deduped_2025-09-21.json
RUSSIA_WEEKLY_BLOB_URL=https://your-blob-url.com/russia-weekly-casualties-deduped_2025-09-21.json
```

### Base URL Configuration

The base blob URL is configured in `src/lib/blobDiscovery.ts`:

```typescript
const BLOB_BASE_URL = 'https://uzymqtgbqiawhqjq.public.blob.vercel-storage.com';
```

## File Structure

```
src/lib/
├── blobDiscovery.ts      # Automatic URL discovery logic
├── blobDataLoader.ts     # Data loading from blob URLs
└── hybridDataLoader.ts   # Main data loader (always uses blob)

scripts/
└── upload-monthly-data.ts # Automated upload script
```

## Benefits

1. **No Manual Configuration** - URLs are discovered automatically
2. **Always Latest Data** - System always uses the most recent files
3. **Resilient** - Multiple fallback mechanisms
4. **Performance** - URL caching reduces API calls
5. **Scalable** - Easy to add new data types

## Troubleshooting

### Common Issues

1. **Blob Discovery Fails**
   - Check if `BLOB_READ_WRITE_TOKEN` is set
   - Verify blob storage permissions
   - Check network connectivity

2. **Files Not Found**
   - Ensure files follow the naming convention
   - Check if files were uploaded successfully
   - Verify the base URL configuration

3. **Cache Issues**
   - Use `clearBlobUrlCache()` to clear the cache
   - Check cache status with `getBlobUrlCacheStatus()`

### Debug Information

The system provides detailed logging:

```
📦 Discovered latest casualties: https://blob-url.com/russia-all-casualties_2025-09-21.json
📦 Using fallback URL for soldiers: https://blob-url.com/ukraine-all-casualties_2025-09-21.json
⚠️  No Ukraine monthly blob URL available
```

## Migration from Local Files

The system has been designed to completely replace local file usage:

1. **All data loading** now goes through `blobDataLoader.ts`
2. **Local files are excluded** from deployment via `.vercelignore`
3. **Fallback data** is provided if blob loading fails
4. **No code changes** needed when new data is uploaded

This ensures the application stays under Vercel's serverless function size limits while providing reliable data access.
