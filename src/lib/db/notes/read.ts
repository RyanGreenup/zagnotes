import { getDbConnection } from "../db-connection";
import { Note } from "../types/response";

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
