import { getDbConnection } from "../db-connection";
import { DbResponse } from "../types/response";
import { formatErrorResponse } from "../utils/errors";

/**
 * Update a folder
 * @param id Folder ID
 * @param title New folder title
 * @returns Success status
 */
export async function updateFolder(
  id: string,
  title: string,
): Promise<DbResponse> {
  const db = await getDbConnection();

  try {
    const result = db
      .prepare(
        `UPDATE folders SET title = ?, updated_time = strftime('%s', CURRENT_TIMESTAMP) WHERE id = ?`,
      )
      .run(title, id);

    if (result.changes === 0) {
      return { success: false, message: "Folder not found" };
    }

    return { success: true, message: "Folder updated successfully" };
  } catch (error) {
    console.error(`Error updating folder ${id}: ${error}`);
    return formatErrorResponse(error, "updating folder");
  }
}

/**
 * Move a Folder
 * @param id Folder ID
 * @param target_parent_folder_id ID of parent
 * @returns Success status
 */
export async function moveFolder(
  id: string,
  target_parent_folder_id: string,
): Promise<DbResponse> {
  const db = await getDbConnection();

  try {
    const result = db
      .prepare(
        `UPDATE folders SET parent_id = ?, updated_time = strftime('%s', CURRENT_TIMESTAMP) WHERE id = ?`,
      )
      .run(target_parent_folder_id, id);

    if (result.changes === 0) {
      return {
        success: false,
        message: `Unable to Update Parent ID of Folder ${id} to ${target_parent_folder_id}`,
      };
    }

    return { success: true, message: "Folder updated successfully" };
  } catch (error) {
    console.error(
      `Error updating folder ${id} to parent id of ${target_parent_folder_id}: ${error}`,
    );
    return formatErrorResponse(error, "updating folder");
  }
}


/**
 * Update a folder
 * @param id Note ID
 * @param target_parent_folder_id
 * @returns Success status
 */
export async function moveNote(
  id: string,
  target_parent_folder_id: string,
): Promise<DbResponse> {
  const db = await getDbConnection();

  try {
    const result = db
      .prepare(
        `UPDATE notes SET parent_id = ?, updated_time = strftime('%s', CURRENT_TIMESTAMP) WHERE id = ?`,
      )
      .run(target_parent_folder_id, id);

    if (result.changes === 0) {
      return {
        success: false,
        message: `Unable to Update Parent ID of note ${id} to ${target_parent_folder_id}`,
      };
    }

    return { success: true, message: "Note Parent updated successfully" };
  } catch (error) {
    console.error(
      `Error updating note ${id} to parent id of ${target_parent_folder_id}: ${error}`,
    );
    return formatErrorResponse(error, "updating note");
  }
}

