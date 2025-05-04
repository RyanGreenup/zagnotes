/**
 * Notes operations module
 * Provides functions for working with notes
 */
import { getDbConnection } from "../db-connection";
import { DbResponse, formatErrorResponse } from "./index";
// Import the necessary functions from the correct modules
import { isFolder, isNote } from "~/lib/db-folder";

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
  "use server";
  // Implementation of a simple UUID generator without external dependencies
  const hex = "0123456789abcdef";
  let uuid = "";

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
  parentId?: string,
): Promise<{ id: string } & DbResponse> {
  "use server";
  const db = await getDbConnection();

  try {
    // Generate a UUID in the format used by existing notes
    const id = generateNoteUuid();

    db.prepare(
      `
      INSERT INTO notes (
        id,
        title,
        body,
        parent_id,
        created_time,
        updated_time
      ) VALUES (?, ?, ?, ?, strftime('%s', CURRENT_TIMESTAMP), strftime('%s', CURRENT_TIMESTAMP))
    `,
    ).run(id, title, body, parentId || "");

    return {
      id,
      success: true,
      message: "Note created successfully",
    };
  } catch (error) {
    console.error("Error creating note:", error);
    return {
      id: "",
      ...formatErrorResponse(error, "creating note"),
    };
  }
}

/**
 * Get a note by ID with full metadata
 * @param id Note ID
 * @returns Complete note object or null if not found
 */
export async function getFullNote(id: string): Promise<Note | null> {
  "use server";
  const db = await getDbConnection({ readonly: true });

  try {
    const note = db
      .prepare(
        `
        SELECT id, title, body, parent_id, created_time, updated_time
        FROM notes
        WHERE id = ?
      `,
      )
      .get(id) as Note | undefined;

    return note || null;
  } catch (error) {
    console.error(`Error fetching full note ${id}:`, error);
    return null;
  }
}

export async function getNoteParent(id: string): Promise<string | null> {
  "use server";
  const db = await getDbConnection({ readonly: true });

  try {
    // The issue is that TypeScript doesn't know the structure of the result object
    // We need to properly type the database result
    const result = db
      .prepare(`SELECT parent_id FROM notes WHERE id = ?`)
      .get(id) as { parent_id?: string | null };

    // Now TypeScript knows that result may have a parent_id property
    return result?.parent_id || null;
  } catch (e) {
    console.error(`Error fetching parent_id for note ${id}`);
    return null;
  }
}

/**
 * Update a note's title
 * @param id Note ID
 * @param title New title
 * @returns Success status
 */
export async function updateNoteTitle(
  id: string,
  title: string,
): Promise<DbResponse> {
  "use server";
  const db = await getDbConnection();

  try {
    // Check if note exists first
    const note = await getFullNote(id);
    if (!note) {
      return { success: false, message: "Note not found" };
    }

    // Update the note title
    db.prepare(
      "UPDATE notes SET title = ?, updated_time = strftime('%s', CURRENT_TIMESTAMP) WHERE id = ?",
    ).run(title, id);

    return { success: true, message: "Note title updated successfully" };
  } catch (error) {
    console.error(`Error updating title for note ${id}:`, error);
    return formatErrorResponse(error, "updating note title");
  }
}

/**
 * Delete a note
 * @param id Note ID
 * @returns Success status
 */
export async function deleteNote(id: string): Promise<DbResponse> {
  "use server";
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
    return formatErrorResponse(error, "deleting note");
  }
}

/*
Utilities
*/

/**
 * Create a new note in the database as a sibling or child of a given note
 * @param title The title of the new note
 * @param parentId The parent folder ID (or empty string for root)
 * @param initialBody Optional initial content for the note
 * @returns Object with note ID and success information
 */
export async function createNewNote(
  title: string,
  parentId: string,
  initialBody: string = "",
): Promise<{ id: string } & DbResponse> {
  "use server";
  try {
    // Determine the effective parent folder
    let effectiveParentId = parentId;

    // If parent ID is a note, make the new note a sibling by using the note's parent
    if (parentId && (await isNote(parentId))) {
      const noteParentId = await getNoteParent(parentId);

      // Use the note's parent or return error if not found
      if (noteParentId === null) {
        return {
          id: "",
          success: false,
          message: `Could not determine parent folder for note ${parentId}`,
        };
      }

      effectiveParentId = noteParentId;
    }

    // Validate that the parent is a folder (if a parent was specified)
    if (effectiveParentId && !(await isFolder(effectiveParentId))) {
      return {
        id: "",
        success: false,
        message: `Parent ${effectiveParentId} is not a valid folder`,
      };
    }

    // Create the note with the effective parent (empty string if no parent)
    return await createNote(title, initialBody, effectiveParentId || "");
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Log the error for debugging
    console.error(
      `Error creating note "${title}" in folder ${parentId}: ${errorMessage}`,
    );

    return {
      id: "",
      success: false,
      message: `Error creating note: ${errorMessage}`,
    };
  }
}

/**
 * Search result interface
 */
export interface SearchResult extends Note {
  score: number;
}

/**
 * Search for notes using full-text search
 * @param query Search query string
 * @param limit Maximum number of results to return (default: 20)
 * @returns Array of matching notes with relevance scores
 */
export async function searchNotes(
  query: string,
  limit: number = 20,
): Promise<SearchResult[]> {
  "use server";
  const db = await getDbConnection({ readonly: true });

  try {
    // For FTS5, we use the bm25() function to get relevance scores
    // Using the porter tokenizer for better matching with stemming
    const results = db
      .prepare(
        `
      SELECT notes.id, notes.title, notes.body, notes.parent_id,
             notes.created_time, notes.updated_time,
             bm25(notes_fts5_porter) AS score
      FROM notes_fts5_porter
      JOIN notes ON notes_fts5_porter.id = notes.id
      WHERE notes_fts5_porter MATCH ?
      ORDER BY score
      LIMIT ?
    `,
      )
      .all(query, limit) as SearchResult[];

    return results;
  } catch (error) {
    console.error("Error searching notes:", error);
    return [];
  }
}

/**
 * Get all notes from the database
 * @returns An array of all notes
 */
export async function getAllNotes(): Promise<Note[]> {
  "use server";
  const db = await getDbConnection({ readonly: true });

  try {
    const notes = db
      .prepare(
        `SELECT id, title, body, parent_id, created_time, updated_time 
         FROM notes
         ORDER BY updated_time DESC`
      )
      .all() as Note[];

    return notes;
  } catch (error) {
    console.error("Error fetching all notes:", error);
    return [];
  }
}
