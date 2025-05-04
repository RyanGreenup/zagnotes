import { getDbConnection } from "../db-connection";
import { DbResponse } from "../types/response";
import { formatErrorResponse } from "../utils/errors";
import { getFullNote } from "./read";


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
