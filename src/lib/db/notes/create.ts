import { getDbConnection } from "../db-connection";
import { isFolder, isNote } from "../utils/check_types";
import { DbResponse } from "../types/response";
import { formatErrorResponse } from "../utils/errors";
import { generateNoteUuid } from "../utils/generate-uuid";
import { getNoteParent } from "./read";

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
