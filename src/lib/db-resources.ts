/**
 * Database functions for handling resources like images
 */
import { getDbConnection } from "./db-connection";
import fs from "fs";
import path from "path";

/**
 * Get the full path to a resource file
 * @param resourceId The resource ID
 * @returns The full path to the resource
 */
export async function getResourcePath(resourceId: string): Promise<string | null> {
  "use server";
  try {
    // Get database path from environment
    const dbPath = process.env.DB_PATH;
    if (!dbPath) {
      throw new Error("Database path not found in environment variables");
    }

    // Resources directory is next to the database
    const resourcesDir = path.join(path.dirname(dbPath), "resources");
    
    // Find the file with matching ID prefix in the resources directory
    const files = fs.readdirSync(resourcesDir);
    const matchingFile = files.find(file => file.startsWith(resourceId));
    
    if (matchingFile) {
      return path.join(resourcesDir, matchingFile);
    }
    
    return null;
  } catch (error) {
    console.error("Error finding resource:", error);
    return null;
  }
}

/**
 * Get a resource file as a buffer
 * @param resourceId The resource ID
 * @returns The resource file buffer and MIME type
 */
export async function getResourceFile(resourceId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  "use server";
  try {
    const resourcePath = await getResourcePath(resourceId);
    if (!resourcePath) {
      return null;
    }

    // Read the file
    const buffer = fs.readFileSync(resourcePath);
    
    // Determine MIME type based on file extension
    const extension = path.extname(resourcePath).toLowerCase();
    let mimeType = "application/octet-stream"; // Default MIME type
    
    // Map common extensions to MIME types
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".webp": "image/webp",
      ".pdf": "application/pdf"
    };
    
    if (extension in mimeTypes) {
      mimeType = mimeTypes[extension];
    }
    
    return { buffer, mimeType };
  } catch (error) {
    console.error("Error reading resource file:", error);
    return null;
  }
}