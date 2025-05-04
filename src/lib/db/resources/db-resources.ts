/**
 * Database functions for handling resources like images
 */
import { getDbConnection } from "../db-connection";
import fs from "fs";
import path from "path";

// Cache for resource paths to avoid expensive file system operations
// OPTIMIZATION: In-memory cache of resource IDs to file paths
const resourcePathCache: Map<string, string | null> = new Map();

// Cache for available files in the resources directory
// OPTIMIZATION: Cache directory listing to avoid redundant fs.readdirSync calls
let cachedResourceFiles: string[] | null = null;
let cachedResourcesDir: string | null = null;
let cacheLastUpdated = 0;
const CACHE_TTL = 60000; // 1 minute cache TTL

/**
 * Get the list of files in the resources directory with caching
 * OPTIMIZATION: Cached directory listing with expiration
 */
function getResourceFiles(resourcesDir: string): string[] {
  const now = Date.now();
  
  // Update cache if it's expired or directory has changed
  if (
    cachedResourceFiles === null || 
    cachedResourcesDir !== resourcesDir || 
    now - cacheLastUpdated > CACHE_TTL
  ) {
    try {
      cachedResourceFiles = fs.readdirSync(resourcesDir);
      cachedResourcesDir = resourcesDir;
      cacheLastUpdated = now;
    } catch (error) {
      console.error("Error reading resources directory:", error);
      return [];
    }
  }
  
  return cachedResourceFiles;
}

/**
 * Get the full path to a resource file
 *
 * This is designed to handle links from Joplin which has
 * links of the form `![](:/{id})`
 * the extension may be described in the database, but I don't want to rely on that
 * Instead we match the first link with the id under `${DB_PATH}/../resources/` and
 * encourage users to include the extension.
 * 
 * FUTURE IMPROVEMENTS:
 * 1. Standardize on using resource IDs WITH extensions to avoid file system lookups
 * 2. Store resource metadata in the database including path and MIME type
 * 3. Consider moving resources to a CDN or dedicated static file server
 * 4. Remove support for ":/" prefix notation to simplify parsing
 * 5. Create an index of resource IDs to filenames during app startup
 * 
 * @param resourceId The resource ID
 * @returns The full path to the resource
 */
export async function getResourcePath(resourceId: string): Promise<string | null> {
  "use server";
  try {
    // OPTIMIZATION: Check cache first before file system operations
    const cacheKey = resourceId;
    const cachedPath = resourcePathCache.get(cacheKey);
    if (cachedPath !== undefined) {
      return cachedPath;
    }

    // Get database path from environment
    const dbPath = process.env.DB_PATH;
    if (!dbPath) {
      throw new Error("Database path not found in environment variables");
    }

    // Resources directory is next to the database
    const resourcesDir = path.join(path.dirname(dbPath), "resources");

    // DEVELOPMENT CHOICE 1: Handle both formats with and without :/ prefix
    // OPTIMIZATION: Faster string check and substring operation
    const normalizedId = resourceId.startsWith(":/") ? resourceId.slice(2) : resourceId;

    // DEVELOPMENT CHOICE 2: Handle IDs with or without extension
    // OPTIMIZATION: Fast regex test to check for extension
    const hasExtension = /\.\w+$/.test(normalizedId);
    
    // OPTIMIZATION: Use cached directory listing
    const files = getResourceFiles(resourcesDir);
    let matchingFile: string | undefined;

    // OPTIMIZATION: More efficient file matching logic
    if (hasExtension) {
      // First try exact match (fastest path)
      matchingFile = files.find(file => file === normalizedId);
      
      if (!matchingFile) {
        // If no exact match, extract base name and try prefix match
        const dotIndex = normalizedId.lastIndexOf('.');
        if (dotIndex > 0) {
          const idPrefix = normalizedId.substring(0, dotIndex);
          // Use startsWith for quick prefix checking
          matchingFile = files.find(file => file.startsWith(idPrefix));
        }
      }
    } else {
      // If no extension provided, match by prefix only
      matchingFile = files.find(file => file.startsWith(normalizedId));
    }

    const result = matchingFile ? path.join(resourcesDir, matchingFile) : null;
    
    // OPTIMIZATION: Cache the result to avoid future filesystem operations
    resourcePathCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error("Error finding resource:", error);
    return null;
  }
}

// OPTIMIZATION: Static MIME type mapping
const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".zip": "application/zip",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".html": "text/html",
  ".md": "text/markdown"
};

// OPTIMIZATION: Cache for resource content to avoid repeated disk reads
// Note: this is a simple implementation - for production you might want 
// to use a more sophisticated cache with size limits and LRU eviction
interface ResourceCacheEntry {
  buffer: Buffer;
  mimeType: string;
  lastAccessed: number;
}

const resourceContentCache: Map<string, ResourceCacheEntry> = new Map();
const CONTENT_CACHE_TTL = 300000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Max number of resources to keep in cache

// OPTIMIZATION: Clear old entries from cache periodically
function cleanupResourceCache() {
  const now = Date.now();
  let oldestKey: string | null = null;
  let oldestTime = Infinity;

  // Remove expired entries and track oldest entry
  for (const [key, entry] of resourceContentCache.entries()) {
    if (now - entry.lastAccessed > CONTENT_CACHE_TTL) {
      resourceContentCache.delete(key);
    } else if (entry.lastAccessed < oldestTime) {
      oldestTime = entry.lastAccessed;
      oldestKey = key;
    }
  }

  // If cache is still too large, remove oldest entry
  if (resourceContentCache.size > MAX_CACHE_SIZE && oldestKey) {
    resourceContentCache.delete(oldestKey);
  }
}

/**
 * Get a resource file as a buffer
 * 
 * FUTURE IMPROVEMENTS:
 * 1. Consider using streams instead of loading entire file into memory
 * 2. Add proper HTTP caching headers (ETag, Last-Modified)
 * 3. Consider implementing a CDN or dedicated image server with proper caching
 * 4. Add image optimization on the fly (resize, compress)
 * 5. Implement resource permissions checks
 * 
 * @param resourceId The resource ID
 * @returns The resource file buffer and MIME type
 */
export async function getResourceFile(resourceId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  "use server";
  try {
    // OPTIMIZATION: Check content cache first
    const cacheKey = resourceId;
    const cachedContent = resourceContentCache.get(cacheKey);
    
    if (cachedContent) {
      // Update last accessed time
      cachedContent.lastAccessed = Date.now();
      return {
        buffer: cachedContent.buffer,
        mimeType: cachedContent.mimeType
      };
    }

    const resourcePath = await getResourcePath(resourceId);
    if (!resourcePath) {
      return null;
    }

    // Read the file
    const buffer = fs.readFileSync(resourcePath);

    // OPTIMIZATION: Faster MIME type lookup with pre-defined mapping
    const extension = path.extname(resourcePath).toLowerCase();
    const mimeType = MIME_TYPES[extension] || "application/octet-stream";

    // OPTIMIZATION: Store in content cache for future requests
    resourceContentCache.set(cacheKey, {
      buffer,
      mimeType,
      lastAccessed: Date.now()
    });

    // Periodically clean up the cache to avoid memory leaks
    if (Math.random() < 0.1) { // Run cleanup ~10% of the time
      cleanupResourceCache();
    }

    return { buffer, mimeType };
  } catch (error) {
    console.error("Error reading resource file:", error);
    return null;
  }
}
