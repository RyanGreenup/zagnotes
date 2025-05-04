import { getDbConnection } from "../db-connection";
import { DbResponse } from "../types/response";
import { formatErrorResponse } from "../utils/errors";
import { getFolder } from "./read";

/**
 * Delete a folder
 * @param id Folder ID
 * @param recursive If true, also delete child folders and notes
 * @returns Success status
 */
export async function deleteFolder(
  id: string,
  recursive: boolean = false,
): Promise<DbResponse> {
  const db = await getDbConnection();

  try {
    // Check if folder exists
    const folder = await getFolder(id);
    if (!folder) {
      return { success: false, message: "Folder not found" };
    }

    // Begin transaction
    const transaction = db.transaction(() => {
      // Check if folder has children
      const childFolders = db
        .prepare("SELECT id FROM folders WHERE parent_id = ?")
        .all(id);
      const childNotes = db
        .prepare("SELECT id FROM notes WHERE parent_id = ?")
        .all(id);

      if ((childFolders.length > 0 || childNotes.length > 0) && !recursive) {
        throw new Error(
          "Folder contains items. Use recursive delete to remove folder and contents.",
        );
      }

      if (recursive) {
        // Use a recursive CTE to identify all descendant folders
        const descendantFoldersSql = `
          WITH RECURSIVE folder_descendants AS (
            -- Base case: the starting folder
            SELECT id FROM folders WHERE id = ?
            UNION ALL
            -- Recursive case: child folders
            SELECT f.id
            FROM folders f
            JOIN folder_descendants fd ON f.parent_id = fd.id
          )
          SELECT id FROM folder_descendants
        `;

        // Get all descendant folder IDs (including the target folder)
        const descendantFolders = db
          .prepare(descendantFoldersSql)
          .all(id) as Array<{ id: string }>;

        // Extract just the IDs
        const folderIds = descendantFolders.map((folder) => folder.id);

        // First delete all notes in any of these folders
        // Create a parameterized query with the right number of placeholders
        const placeholders = folderIds.map(() => "?").join(",");

        if (folderIds.length > 0) {
          // Delete notes first (foreign key constraint)
          db.prepare(
            `DELETE FROM notes WHERE parent_id IN (${placeholders})`,
          ).run(...folderIds);

          // Delete folders in reverse hierarchical order (children before parents)
          // The recursive CTE query returns them in an order where parents come before children,
          // so we need to process them in reverse to delete children first
          for (let i = folderIds.length - 1; i >= 0; i--) {
            if (folderIds[i] !== id) {
              // Skip the target folder as we'll delete it last
              db.prepare("DELETE FROM folders WHERE id = ?").run(folderIds[i]);
            }
          }
        }
      }

      // Delete the target folder itself
      db.prepare("DELETE FROM folders WHERE id = ?").run(id);
    });

    // Execute the transaction
    transaction();

    return { success: true, message: "Folder deleted successfully" };
  } catch (error) {
    console.error(`Error deleting folder ${id}: ${error}`);
    return formatErrorResponse(error, "deleting folder");
  }
}
