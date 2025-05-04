import { getDbConnection } from "../db-connection";
import { DbResponse, Folder } from "../types/response";
import { formatErrorResponse } from "../utils/errors";
import { getFolder } from "./read";

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
    console.error(`Error creating folder: ${error}`);
    return {
      folder: null,
      ...formatErrorResponse(error, "creating folder"),
    };
  }
}

