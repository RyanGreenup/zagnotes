import { getDbConnection } from "../db-connection";
import { Folder } from "../types/response";

/**
 * Get all folders
 * @returns Array of all folders
 */
export async function getAllFolders(): Promise<Folder[]> {
  "use server";
  const db = await getDbConnection({ readonly: true });

  try {
    const folders = db
      .prepare(
        "SELECT id, title, parent_id, created_time, updated_time FROM folders",
      )
      .all();
    return folders as Folder[];
  } catch (error) {
    console.error(`Error fetching folders: ${error}`);
    return [];
  }
}

/**
 * Get a folder by ID
 * @param id Folder ID
 * @returns Folder object or null if not found
 */
export async function getFolder(id: string): Promise<Folder | null> {
  "use server";
  const db = await getDbConnection({ readonly: true });

  try {
    const folder = db
      .prepare(
        "SELECT id, title, parent_id, created_time, updated_time FROM folders WHERE id = ?",
      )
      .get(id);

    return (folder as Folder) || null;
  } catch (error) {
    console.error(`Error fetching folder ${id}: ${error}`);
    return null;
  }
}


