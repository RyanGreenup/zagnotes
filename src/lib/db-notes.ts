/**
 * Notes operations module
 * Provides functions for working with notes
 */
import { getDbConnection } from "./db-connection";
import { DbResponse, formatErrorResponse } from "./index";

/**
 * Note interface
 */
export interface Note {
  id: string;
  title: string;
  body: string;
  parent_id?: string | null;
  created_time?: string;
  updated_time?: string;
}

/**
 * Generate a UUID in the format used by the notes system
 * Creates a 32-character hexadecimal string without dashes
 * @returns A UUID string
 */
function generateNoteUuid(): string {
  // Implementation of a simple UUID generator without external dependencies
  const hex = '0123456789abcdef';
  let uuid = '';

  // Generate 32 hex characters (128 bits)
  for (let i = 0; i < 32; i++) {
    uuid += hex[Math.floor(Math.random() * 16)];
  }

  return uuid;
}

/**
 * Create a new note
 * @param title Note title
 * @param body Note content
 * @param parentId Parent folder ID (optional)
 * @returns Object with the new note ID and operation status
 */
export async function createNote(
  title: string,
  body: string = "",
  parentId?: string
): Promise<{ id: string } & DbResponse> {
  const db = await getDbConnection();

  try {
    // Generate a UUID in the format used by existing notes
    const id = generateNoteUuid();

    db.prepare(`
      INSERT INTO notes (
        id,
        title,
        body,
        parent_id,
        created_time,
        updated_time
      ) VALUES (?, ?, ?, ?, strftime('%s', CURRENT_TIMESTAMP), strftime('%s', CURRENT_TIMESTAMP))
    `).run(
      id,
      title,
      body,
      parentId || ""
    );

    return {
      id,
      success: true,
      message: "Note created successfully"
    };
  } catch (error) {
    console.error('Error creating note:', error);
    return {
      id: '',
      ...formatErrorResponse(error, 'creating note')
    };
  }
}

/**
 * Get a note by ID with full metadata
 * @param id Note ID
 * @returns Complete note object or null if not found
 */
export async function getFullNote(id: string): Promise<Note | null> {
  const db = await getDbConnection({ readonly: true });

  try {
    const note = db
      .prepare(`
        SELECT id, title, body, parent_id, created_time, updated_time
        FROM notes
        WHERE id = ?
      `)
      .get(id) as Note | undefined;

    return note || null;
  } catch (error) {
    console.error(`Error fetching full note ${id}:`, error);
    return null;
  }
}

export async function getNoteParent(id: string): Promise<string | null> {
    const db = await getDbConnection({readonly: true});

    try {
      // The issue is that TypeScript doesn't know the structure of the result object
      // We need to properly type the database result
      const result = db.prepare(`SELECT parent_id FROM notes WHERE id = ?`).get(id) as { parent_id?: string | null };

      // Now TypeScript knows that result may have a parent_id property
      return result?.parent_id || null;

    } catch (e) {
        console.error(`Error fetching parent_id for note ${id}`)
        return null;
    }
}

/**
 * Delete a note
 * @param id Note ID
 * @returns Success status
 */
export async function deleteNote(id: string): Promise<DbResponse> {
  const db = await getDbConnection();

  try {
    // Check if note exists first
    const note = await getFullNote(id);
    if (!note) {
      return { success: false, message: "Note not found" };
    }

    // Delete the note
    db.prepare("DELETE FROM notes WHERE id = ?").run(id);

    return { success: true, message: "Note deleted successfully" };
  } catch (error) {
    console.error(`Error deleting note ${id}:`, error);
    return formatErrorResponse(error, 'deleting note');
  }
}
