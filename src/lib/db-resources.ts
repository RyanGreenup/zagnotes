/**
 * Database functions for handling resources like images
 */
import { getDbConnection } from "./db-connection";
import fs from "fs";
import path from "path";

/**
 * Get the full path to a resource file
 *
 * This is designed to handle links from Joplin which has
 * links of the form `![](:/{id})`
 * the extension may be described in the database, but I don't want to rely on that
 * Instead we match the first link with the id under `${DB_PATH}/../resources/` and
 * encourage users to include the extension.
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

    // DEVELOPMENT CHOICE 1: Handle both formats with and without :/ prefix
    // Strip leading ':/' if present to normalize the resourceId
    // This allows us to handle both formats: ":/123abc" and "123abc"
    let normalizedId = resourceId.startsWith(":/")
      ? resourceId.substring(2)
      : resourceId;

    // DEVELOPMENT CHOICE 2: Handle IDs with or without extension
    // First, check if the ID already includes a file extension
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(normalizedId);

    // Find the file with matching ID prefix in the resources directory
    const files = fs.readdirSync(resourcesDir);
    let matchingFile: string | undefined;

    if (hasExtension) {
      // If the ID includes an extension, look for an exact match first
      matchingFile = files.find(file => file === normalizedId);

      // If no exact match, try matching just the prefix
      if (!matchingFile) {
        // Extract the ID part without extension
        const idWithoutExt = normalizedId.substring(0, normalizedId.lastIndexOf('.'));
        matchingFile = files.find(file => file.startsWith(idWithoutExt));
      }
    } else {
      // If no extension in the ID, just match the prefix
      matchingFile = files.find(file => file.startsWith(normalizedId));
    }

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
