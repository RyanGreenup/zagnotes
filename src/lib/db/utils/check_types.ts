import { getDbConnection } from "../db-connection";

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
    console.error(`Error checking if ${id} is a note: ${error}`);
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
    console.error(`Error checking if ${id} is a tag: ${error}`);
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
