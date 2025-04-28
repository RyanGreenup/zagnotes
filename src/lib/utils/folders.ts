"use server";
import { DbResponse, getDbConnection } from "..";
import { getNoteParent } from "../db-notes";

// Moves a note or a folder underneath a folder in the database representation
export async function moveItem(
  id: string,
  targetParentId: string,
): Promise<DbResponse> {
  "use server";
  try {
    // Import required functions dynamically to avoid circular dependencies
    const { moveNote, moveFolder, isFolder, isNote } = await import(
      "~/lib/db-folder"
    );

    // Validate that target is a folder
    if (!(await isFolder(targetParentId))) {
      return {
        success: false,
        message: `Target ${targetParentId} is not a folder`,
      };
    }

    // Move the item based on its type
    if (await isFolder(id)) {
      return await moveFolder(id, targetParentId);
    } else if (await isNote(id)) {
      return await moveNote(id, targetParentId);
    }

    // Fallback case - we don't know what type it is but we'll try folder
    return await moveFolder(id, targetParentId);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Log the error for debugging
    console.error(
      `Error moving item ${id} to ${targetParentId}: ${errorMessage}`,
    );

    return {
      success: false,
      message: `Error moving item ${id} to ${targetParentId}`,
    };
  }
}

/**
 * Move an item (note or folder) to the root level
 * @param id The ID of the item to move
 * @returns Success status
 */
export async function moveItemToRoot(id: string): Promise<DbResponse> {
  "use server";
  try {
    // Import required functions dynamically to avoid circular dependencies
    const { moveFolder, isFolder, isNote } = await import("~/lib/db-folder");

    // Check item type and move it accordingly
    if (await isFolder(id)) {
      return await moveFolder(id, "");
    } else if (await isNote(id)) {
      return {
        success: false,
        message: "Notes must be moved under a folder",
      };
    }

    return {
      success: false,
      message: "Item not found or is neither a note nor a folder",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Log the error for debugging
    console.error(`Error moving item ${id} to root: ${errorMessage}`);

    return {
      success: false,
      message: `Error moving item to root: ${errorMessage}`,
    };
  }
}

export async function getFolderParent(id: string): Promise<string | null> {
  const db = await getDbConnection({ readonly: true });

  try {
    // The issue is that TypeScript doesn't know the structure of the result object
    // We need to properly type the database result
    const result = db
      .prepare(`SELECT parent_id FROM folders WHERE id = ?`)
      .get(id) as { parent_id?: string | null };

    // Now TypeScript knows that result may have a parent_id property
    return result?.parent_id || null;
  } catch (e) {
    console.error(`Error fetching parent_id for folder ${id}`);
    return null;
  }
}

export interface PromotionResult extends DbResponse {
  parent_id?: string;
}

export async function promoteItem(id: string): Promise<PromotionResult> {
  // Import required functions dynamically to avoid circular dependencies
  const { isFolder, isNote, moveFolder, moveNote } = await import("~/lib/db-folder");

  if (await isFolder(id)) {
    const parent_id = await getFolderParent(id);
    if (parent_id === null) {
      return {
        success: false,
        message: "Folder has no parent to Promote to",
      };
    } else {
      const result = await moveFolder(id, parent_id);
      return {
        ...result,
        parent_id,
      };
    }
  } else if (await isNote(id)) {
    const error_message = {
      success: false,
      message: "Note has no parent to Promote to",
    };
    const first_parent_id = await getNoteParent(id);
    if (first_parent_id === null) {
      return error_message;
    }
    const parent_id = await getFolderParent(first_parent_id);
    if (parent_id === null) {
      return error_message;
    } else {
      const result = await moveNote(id, parent_id);
      return {
        ...result,
        parent_id,
      };
    }
  } else {
    return {
      success: false,
      message: "Item is neither a note nor a folder",
    };
  }
}

/**
 * Update the title of a note or folder
 * @param id The ID of the item to update
 * @param title The new title for the item
 * @returns Success status
 */
export async function updateItemTitle(id: string, title: string): Promise<DbResponse> {
  "use server";
  try {
    // Import required functions dynamically to avoid circular dependencies
    const { updateFolder, isFolder, isNote } = await import("~/lib/db-folder");
    const { updateNoteTitle } = await import("~/lib/db-notes");

    // Check item type and update accordingly
    if (await isFolder(id)) {
      return await updateFolder(id, title);
    } else if (await isNote(id)) {
      return await updateNoteTitle(id, title);
    }

    return {
      success: false,
      message: "Item not found or is neither a note nor a folder",
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Log the error for debugging
    console.error(`Error updating title for item ${id}: ${errorMessage}`);

    return {
      success: false,
      message: `Error updating item title: ${errorMessage}`,
    };
  }
}

/**
 * Delete a note or folder from the database
 * @param id The ID of the item to delete
 * @returns Success status
 */
export async function deleteItem(id: string): Promise<DbResponse> {
  "use server";
  try {
    // Import required functions dynamically to avoid circular dependencies
    const { deleteFolder, isFolder, isNote } = await import("~/lib/db-folder");
    const { deleteNote } = await import("~/lib/db-notes");

    // Check item type and delete accordingly
    if (await isFolder(id)) {
      return await deleteFolder(id, true); // Non-recursive by default
    } else if (await isNote(id)) {
      return await deleteNote(id);
    }

    return {
      success: false,
      message: "Item not found or is neither a note nor a folder",
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Log the error for debugging
    console.error(`Error deleting item ${id}: ${errorMessage}`);

    return {
      success: false,
      message: `Error deleting item: ${errorMessage}`,
    };
  }
}
