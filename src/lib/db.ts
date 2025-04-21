/**
 * Database utility module for SQLite operations
 * Provides a singleton database connection and functions for interacting with notes
 */

import type { Database } from 'better-sqlite3';

let db: Database | null = null;
let isInitialized = false;

/**
 * Initialize the database connection
 * @returns The database instance
 */
export async function getDb() {
  // If already initialized, return the existing database connection
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
    db = new Database(dbPath);
    isInitialized = true;
    
    // Ensure the notes table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT,
        body TEXT,
        created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
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
export function closeDb() {
  if (db && isInitialized) {
    db.close();
    db = null;
    isInitialized = false;
  }
}

/**
 * Get a note by ID
 * @param id The note ID
 * @returns The note data or null if not found
 */
export async function getNote(id: string): Promise<{ body: string } | null> {
  const db = await getDb();
  
  try {
    const note = db.prepare('SELECT body FROM notes WHERE id = ?').get(id) as { body: string } | undefined;
    return note || null;
  } catch (error) {
    console.error(`Error fetching note ${id}:`, error);
    throw error;
  }
}

/**
 * Save a note
 * @param id The note ID
 * @param content The note content
 * @returns Success status
 */
export async function saveNote(id: string, content: string): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  
  try {
    // Begin a transaction for data consistency
    const transaction = db.transaction((noteId, noteContent) => {
      // Check if the note exists
      const note = db.prepare('SELECT id FROM notes WHERE id = ?').get(noteId);
      
      if (note) {
        // Update existing note
        db.prepare('UPDATE notes SET body = ?, updated_time = CURRENT_TIMESTAMP WHERE id = ?')
          .run(noteContent, noteId);
      } else {
        // Create new note
        db.prepare('INSERT INTO notes (id, body, created_time, updated_time) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
          .run(noteId, noteContent);
      }
    });
    
    // Execute the transaction
    transaction(id, content);
    
    return { success: true, message: "Note saved successfully" };
  } catch (error) {
    console.error(`Error saving note ${id}:`, error);
    return { 
      success: false, 
      message: `Error saving note: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}