// Blob discovery utility for automatically finding the latest data files
import { list } from '@vercel/blob';

// Base blob storage URL
const BLOB_BASE_URL = 'https://uzymqtgbqiawhqjq.public.blob.vercel-storage.com';

// File patterns to look for
const FILE_PATTERNS = {
  casualties: /^russia-all-casualties_\d{4}-\d{2}-\d{2}\.json$/,
  soldiers: /^ukraine-all-casualties_\d{4}-\d{2}-\d{2}\.json$/,
  ukraine_monthly: /^ukraine-monthly-casualties-deduped_\d{4}-\d{2}-\d{2}\.json$/,
  russia_monthly: /^russia-monthly-casualties-deduped_\d{4}-\d{2}-\d{2}\.json$/,
  ukraine_weekly: /^ukraine-weekly-casualties-deduped_\d{4}-\d{2}-\d{2}\.json$/,
  russia_weekly: /^russia-weekly-casualties-deduped_\d{4}-\d{2}-\d{2}\.json$/,
};

// Cache for discovered URLs to avoid repeated API calls
let urlCache: Record<string, { url: string; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to extract date from filename
function extractDateFromFilename(filename: string): Date | null {
  const dateMatch = filename.match(/\d{4}-\d{2}-\d{2}/);
  if (dateMatch) {
    return new Date(dateMatch[0]);
  }
  return null;
}

// Helper function to find the latest file matching a pattern
function findLatestFile(files: Array<{ pathname: string; uploadedAt: string }>, pattern: RegExp): string | null {
  const matchingFiles = files
    .filter(file => pattern.test(file.pathname))
    .map(file => ({
      pathname: file.pathname,
      uploadedAt: new Date(file.uploadedAt),
      dateFromName: extractDateFromFilename(file.pathname)
    }))
    .sort((a, b) => {
      // Prefer date from filename if available, otherwise use upload date
      const dateA = a.dateFromName || a.uploadedAt;
      const dateB = b.dateFromName || b.uploadedAt;
      return dateB.getTime() - dateA.getTime();
    });

  return matchingFiles.length > 0 ? matchingFiles[0].pathname : null;
}

// Main function to discover the latest blob URL for a given pattern
export async function discoverLatestBlobUrl(pattern: string): Promise<string | null> {
  try {
    // Check cache first
    const cached = urlCache[pattern];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.url;
    }

    // Skip environment variables for now and always use fallback URLs
    // const envUrl = process.env[`${pattern.toUpperCase()}_BLOB_URL`];
    // if (envUrl) {
    //   urlCache[pattern] = { url: envUrl, timestamp: Date.now() };
    //   return envUrl;
    // }

    // Skip blob listing for now and always use fallback URLs
    console.log(`📦 Using fallback URLs for ${pattern} (blob listing disabled)`);

    // Fallback to hardcoded URLs if blob listing fails
    const fallbackUrls: Record<string, string> = {
      'casualties': `${BLOB_BASE_URL}/russia-all-casualties_2025-08-21.json`,
      'soldiers': `${BLOB_BASE_URL}/ukraine-all-casualties_2025-08-21.json`,
      'ukraine_monthly': `${BLOB_BASE_URL}/ukraine-monthly-casualties-deduped_2025-08-21.json`,
      'russia_monthly': `${BLOB_BASE_URL}/russia-monthly-casualties-deduped_2025-08-21.json`,
      'ukraine_weekly': `${BLOB_BASE_URL}/ukraine-weekly-casualties-deduped_2025-08-21.json`,
      'russia_weekly': `${BLOB_BASE_URL}/russia-weekly-casualties-deduped_2025-08-21.json`,
    };

    const fallbackUrl = fallbackUrls[pattern];
    if (fallbackUrl) {
      urlCache[pattern] = { url: fallbackUrl, timestamp: Date.now() };
      console.log(`📦 Using fallback URL for ${pattern}: ${fallbackUrl}`);
      return fallbackUrl;
    }

    console.warn(`No URL found for pattern: ${pattern}`);
    return null;
  } catch (error) {
    console.warn(`Failed to discover blob URL for pattern ${pattern}:`, error);
    return null;
  }
}

// Function to clear the cache (useful for testing or manual refresh)
export function clearBlobUrlCache(): void {
  urlCache = {};
}

// Function to get cache status
export function getBlobUrlCacheStatus(): Record<string, { url: string; age: number }> {
  const now = Date.now();
  const status: Record<string, { url: string; age: number }> = {};
  
  for (const [pattern, cached] of Object.entries(urlCache)) {
    status[pattern] = {
      url: cached.url,
      age: now - cached.timestamp
    };
  }
  
  return status;
}
