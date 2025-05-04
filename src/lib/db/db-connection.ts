/**
 * Core database connection module
 * Provides singleton connection management
 */
import type { Database } from 'better-sqlite3';

let db: Database | null = null;
let isInitialized = false;

/**
 * Get the database connection instance
 * @param options Connection options
 * @returns The database instance
 */
export async function getDbConnection(options: { readonly?: boolean } = {}) {
  // If already initialized and not requesting a specific mode, return the existing connection
  if (db && isInitialized) {
    return db;
  }

  // Import database module dynamically for server-side only code
  const Database = await import('better-sqlite3').then(module => module.default);

  const dbPath = process.env.DB_PATH;
  if (!dbPath) {
    throw new Error('Database path not found in environment variables');
  }

  try {
    // Create/open the database connection
    db = new Database(dbPath, {readonly: false});
    isInitialized = true;

    // Set pragmas for better performance
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');

    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Close the database connection
 * Usually only needed when shutting down the application
 */
export function closeDbConnection() {
  if (db && isInitialized) {
    db.close();
    db = null;
    isInitialized = false;
  }
}

/**
 * Get database connection status
 * @returns Status information
 */
export async function getDbStatus(): Promise<{ connected: boolean; path: string | null }> {
  const dbPath = process.env.DB_PATH;

  return {
    connected: isInitialized && db !== null,
    path: dbPath || null
  };
}

/**
 * Initialize the database schema
 * Creates necessary tables if they don't exist
 */
export async function initializeDbSchema() {
  const db = await getDbConnection();

  // Create tables in a transaction
  db.exec(`
    BEGIN TRANSACTION;

    -- Notes table
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT,
      body TEXT,
      parent_id TEXT,
      created_time TIMESTAMP DEFAULT strftime('%s', CURRENT_TIMESTAMP),
      updated_time TIMESTAMP DEFAULT strftime('%s', CURRENT_TIMESTAMP)
    );

    -- Folders table
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      title TEXT,
      parent_id TEXT,
      created_time TIMESTAMP DEFAULT strftime('%s', CURRENT_TIMESTAMP),
      updated_time TIMESTAMP DEFAULT strftime('%s', CURRENT_TIMESTAMP)
    );

    COMMIT;
  `);

  return db;
}
