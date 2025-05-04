import { getDbConnection } from "../db-connection";
import { Folder } from "../types/response";

/**
 * Get all folders
 * @returns Array of all folders
 */
export async function getAllFolders(): Promise<Folder[]> {
  // NOTE 'use server' here signifincantly slows down application
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
  // TODO the use server is broken in this function I think.
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


