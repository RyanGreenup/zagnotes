/**
 * Core note operations module
 * Provides functions for interacting with individual notes
 */
import { getDbConnection } from "./db-connection";
import { DbResponse, formatErrorResponse } from "../index";
import { DbNote } from "../types";

/**
 * Get a note by ID
 * @param id The note ID
 * @returns The note data or null if not found
 */
export async function getNote(
  id: string,
): Promise<{ body: string; title?: string } | null> {
  const db = await getDbConnection({ readonly: true });

  try {
    // Get note content with title if available
    const note = db
      .prepare("SELECT body, title FROM notes WHERE id = ?")
      .get(id) as { body: string; title?: string } | undefined;
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
 * @param title Optional title for the note
 * @returns Success status
 */
export async function saveNote(
  id: string,
  content: string,
  title?: string,
): Promise<DbResponse> {
  const db = await getDbConnection();

  try {
    // Begin a transaction for data consistency
    const transaction = db.transaction((noteId, noteContent, noteTitle) => {
      // Check if the note exists
      const note = db
        .prepare("SELECT id, title FROM notes WHERE id = ?")
        .get(noteId);

      if (note) {
        // Update existing note
        if (noteTitle) {
          // Update both content and title
          db.prepare(
            `UPDATE notes SET body = ?, title = ?, updated_time = strftime('%s', CURRENT_TIMESTAMP) WHERE id = ?`,
          ).run(noteContent, noteTitle, noteId);
        } else {
          // Update only content
          db.prepare(
            `UPDATE notes SET body = ?, updated_time = strftime('%s', CURRENT_TIMESTAMP) WHERE id = ?`,
          ).run(noteContent, noteId);
        }
      } else {
        // Create new note (use provided title or ID as fallback)
        db.prepare(
          `INSERT INTO notes (id, title, body, created_time, updated_time) VALUES (?, ?, ?, strftime('%s', CURRENT_TIMESTAMP), strftime('%s', CURRENT_TIMESTAMP))`,
        ).run(noteId, noteTitle || noteId, noteContent);
      }
    });

    // Execute the transaction
    transaction(id, content, title);

    return { success: true, message: "Note saved successfully" };
  } catch (error) {
    console.error(`Error saving note ${id}:`, error);
    return formatErrorResponse(error, "saving note");
  }
}
