import { getDbConnection } from "../db-connection";
import { DbResponse } from "../types/response";
import { formatErrorResponse } from "../utils/errors";
import { getFullNote } from "./read";

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
