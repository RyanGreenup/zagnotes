import { DbFolder } from "~/lib/types";
import { getDbConnection } from "../db-connection";
import { DbResponse } from "../types/response";
import { formatErrorResponse } from "../utils/errors";

/**
 * Move a note or folder to a new parent
 * @param id The ID of the item to move
 * @param parentId The new parent ID
 * @param type The type of item ('note' or 'folder')
 * @returns Success status
 */
export async function moveItem(
  id: string,
  parentId: string | null,
  type: 'note' | 'folder'
): Promise<DbResponse> {
  const db = await getDbConnection();

  try {
    if (type === 'folder') {
      // Check for circular references if moving a folder
      if (parentId) {
        let currentParentId = parentId;
        const visited = new Set<string>();

        while (currentParentId) {
          if (currentParentId === id) {
            return {
              success: false,
              message: "Cannot move a folder into its own descendant (would create circular reference)"
            };
          }

          if (visited.has(currentParentId)) {
            return {
              success: false,
              message: "Detected circular reference in folder structure"
            };
          }

          visited.add(currentParentId);

          // Get the parent of the current parent
          const parentFolder = db.prepare('SELECT parent_id FROM folders WHERE id = ?').get(currentParentId) as DbFolder;
          if (!parentFolder || !parentFolder.parent_id) break;

          currentParentId = parentFolder.parent_id;
        }
      }

      // Move the folder
      db.prepare('UPDATE folders SET parent_id = ?, updated_time = strftime(%s, CURRENT_TIMESTAMP) WHERE id = ?')
        .run(parentId, id);
    } else {
      // Move the note
      db.prepare('UPDATE notes SET parent_id = ?, updated_time = strftime(%s, CURRENT_TIMESTAMP) WHERE id = ?')
        .run(parentId, id);
    }

    return { success: true, message: `${type === 'folder' ? 'Folder' : 'Note'} moved successfully` };
  } catch (error) {
    console.error(`Error moving ${type}:`, error);
    return formatErrorResponse(error, `moving ${type}`);
  }
}
