/**
 * Folder operations module
 * Provides functions for working with folders
 */
import { getDbConnection } from './db-connection';

/**
 * Folder interface
 */
export interface Folder {
  id: string;
  title: string;
  parent_id?: string | null;
  created_time?: string;
  updated_time?: string;
}

/**
 * Get all folders
 * @returns Array of all folders
 */
export async function getAllFolders(): Promise<Folder[]> {
  const db = await getDbConnection({ readonly: true });

  try {
    const folders = db.prepare('SELECT id, title, parent_id, created_time, updated_time FROM folders')
      .all();
    return folders;
  } catch (error) {
    console.error('Error fetching folders:', error);
    return [];
  }
}

/**
 * Get a folder by ID
 * @param id Folder ID
 * @returns Folder object or null if not found
 */
export async function getFolder(id: string): Promise<Folder | null> {
  const db = await getDbConnection({ readonly: true });

  try {
    const folder = db.prepare(
      'SELECT id, title, parent_id, created_time, updated_time FROM folders WHERE id = ?'
    ).get(id);

    return folder || null;
  } catch (error) {
    console.error(`Error fetching folder ${id}:`, error);
    return null;
  }
}

/**
 * Update a folder
 * @param id Folder ID
 * @param title New folder title
 * @returns Success status
 */
export async function updateFolder(
  id: string,
  title: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDbConnection();

  try {
    const result = db.prepare(
      `UPDATE folders SET title = ?, updated_time = strftime('%s', CURRENT_TIMESTAMP) WHERE id = ?`
    ).run(title, id);

    if (result.changes === 0) {
      return { success: false, message: "Folder not found" };
    }

    return { success: true, message: "Folder updated successfully" };
  } catch (error) {
    console.error(`Error updating folder ${id}:`, error);
    return {
      success: false,
      message: `Error updating folder: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Delete a folder
 * @param id Folder ID
 * @param recursive If true, also delete child folders and notes
 * @returns Success status
 */
export async function deleteFolder(
  id: string,
  recursive: boolean = false
): Promise<{ success: boolean; message: string }> {
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
      const childFolders = db.prepare('SELECT id FROM folders WHERE parent_id = ?').all(id);
      const childNotes = db.prepare('SELECT id FROM notes WHERE parent_id = ?').all(id);

      if ((childFolders.length > 0 || childNotes.length > 0) && !recursive) {
        throw new Error("Folder contains items. Use recursive delete to remove folder and contents.");
      }

      if (recursive) {
        // Delete child notes
        db.prepare('DELETE FROM notes WHERE parent_id = ?').run(id);

        // Recursively delete child folders
        const deleteChildFolders = db.prepare('SELECT id FROM folders WHERE parent_id = ?').all(id);
        for (const childFolder of deleteChildFolders) {
          // This is a simplification; a more robust implementation would use a CTE
          // to delete the entire subtree in one query
          const deleteRecursive = db.transaction((folderId) => {
            const grandchildren = db.prepare('SELECT id FROM folders WHERE parent_id = ?').all(folderId);
            db.prepare('DELETE FROM notes WHERE parent_id = ?').run(folderId);
            for (const grandchild of grandchildren) {
              deleteRecursive(grandchild.id);
            }
            db.prepare('DELETE FROM folders WHERE id = ?').run(folderId);
          });

          deleteRecursive(childFolder.id);
        }
      }

      // Delete the folder itself
      db.prepare('DELETE FROM folders WHERE id = ?').run(id);
    });

    // Execute the transaction
    transaction();

    return { success: true, message: "Folder deleted successfully" };
  } catch (error) {
    console.error(`Error deleting folder ${id}:`, error);
    return {
      success: false,
      message: `Error deleting folder: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
