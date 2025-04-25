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
    // Generate a unique ID for the note
    const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
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
      .get(id);

    return note || null;
  } catch (error) {
    console.error(`Error fetching full note ${id}:`, error);
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