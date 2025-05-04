"use server";
import type { Database } from 'better-sqlite3';
import * as sqliteVec from "sqlite-vec";

/**
 * Ensures the sqlite-vec extension is loaded in the database
 * @param db Database connection
 * @returns Boolean indicating if the extension was already loaded or needed to be loaded
 */
export async function ensureSqliteVecLoaded(db: Database): Promise<boolean> {
  try {
    // First, check if the extension is already loaded
    const versionResult = db.prepare("SELECT sqlite_vec_version() AS version").get() as { version: string } | undefined;

    if (versionResult) {
      console.log(`sqlite-vec extension already loaded, version: ${versionResult.version}`);
      return true; // Extension was already loaded
    }
  } catch (error) {
    // Extension is not loaded, we'll load it below
    console.log('sqlite-vec extension not yet loaded, attempting to load it now');
  }

  try {
    // Load the extension using the sqliteVec helper
    sqliteVec.load(db);


    // Verify it was loaded successfully
    const versionResult = db.prepare("select vec_version() as vec_version;").get() as { vec_version: string };
    console.log(`Successfully loaded sqlite-vec extension, version: ${versionResult.vec_version}`);

    return false; // Extension needed to be loaded
  } catch (error) {
    console.error('Failed to load sqlite-vec extension:', error);
    throw new Error('Semantic search requires the sqlite-vec extension, but it could not be loaded');
  }
}
