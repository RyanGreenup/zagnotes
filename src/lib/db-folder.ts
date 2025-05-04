"use server";
// TODO "use server"; breaks this
// NOTE I think functions need use server not file according to the vinxi output
/**
 * Folder operations module
 * Provides functions for working with folders
 */
import { getDbConnection } from "./db-connection";
import { DbResponse, formatErrorResponse } from "./index";
// server-side code
import crypto from "crypto";

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

/**
 * Checks if an item is a folder
 * @param id - UUID of item to check
 * @returns Promise resolving to true if the item is a folder, false otherwise
 */
export async function isFolder(id: string): Promise<boolean> {
  const db = await getDbConnection({ readonly: true });

  try {
    const result = db
      .prepare("SELECT COUNT(id) as count FROM folders WHERE id = ?")
      .get(id);

    return (
      result !== null &&
      typeof result === "object" &&
      "count" in result &&
      result.count === 1
    );
  } catch (error) {
    console.error(`Error checking if ${id} is a folder: ${error}`);
    return false;
  }
}

/**
 * Checks if an item is a note
 * @param id - UUID of item to check
 * @returns Promise resolving to true if the item is a note, false otherwise
 */
export async function isNote(id: string): Promise<boolean> {
  const db = await getDbConnection({ readonly: true });

  try {
    const result = db
      .prepare("SELECT COUNT(id) as count FROM notes WHERE id = ?")
      .get(id);

    return (
      result !== null &&
      typeof result === "object" &&
      "count" in result &&
      result.count === 1
    );
  } catch (error) {
    logger.error(`Error checking if ${id} is a note: ${error}`);
    return false;
  }
}

/**
 * Checks if an item is a tag
 * @param id - UUID of item to check
 * @returns Promise resolving to true if the item is a tag, false otherwise
 */
export async function isTag(id: string): Promise<boolean> {
  const db = await getDbConnection({ readonly: true });

  try {
    const result = db
      .prepare("SELECT COUNT(id) as count FROM tags WHERE id = ?")
      .get(id);

    return (
      result !== null &&
      typeof result === "object" &&
      "count" in result &&
      result.count === 1
    );
  } catch (error) {
    logger.error(`Error checking if ${id} is a tag: ${error}`);
    return false;
  }
}

export enum DbItemType{
    FOLDER= "folder",
    NOTE = "note",
    TAG = "tag",


}

export async function getType(id: string): Promise<DbItemType | null> {
  try {
    if (await isFolder(id)) {
      return DbItemType.FOLDER;
    }
  } catch (e) {
    console.log(`Unable to get type of ${id}: ${e}`);
  }

  try {
    if (await isNote(id)) {
      return DbItemType.NOTE;
    }
  } catch (e) {
    console.log(`Unable to get type of ${id}: ${e}`);
  }

  try {
    if (await isTag(id)) {
      return DbItemType.TAG;
    }
  } catch (e) {
    console.log(`Unable to get type of ${id}: ${e}`);
  }

  return null;

}

/**
 * Create a new folder
 * @param title Folder title
 * @param parentId Parent folder ID (optional)
 * @returns The created folder with success status
 */
export async function createFolder(
  title: string,
  parentId?: string | null,
): Promise<{ folder: Folder | null } & DbResponse> {
  "use server";
  const db = await getDbConnection();

  try {
    // Generate a UUID
    const id = crypto.randomUUID().replace(/-/g, "");

    db.prepare(
      `INSERT INTO folders (id, title, parent_id, created_time, updated_time)
      VALUES (?, ?, ?, strftime('%s', CURRENT_TIMESTAMP), strftime('%s', CURRENT_TIMESTAMP))`,
    ).run(id, title, parentId || null);

    // Return the newly created folder
    const folder = await getFolder(id);

    return {
      folder,
      success: true,
      message: "Folder created successfully",
    };
  } catch (error) {
    logger.error(`Error creating folder: ${error}`);
    return {
      folder: null,
      ...formatErrorResponse(error, "creating folder"),
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
    logger.error(`Error deleting folder ${id}: ${error}`);
    return formatErrorResponse(error, "deleting folder");
  }
}
