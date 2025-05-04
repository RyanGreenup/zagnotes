/**
 * Common types for the Zag Notes application
 */

/**
 * Database folder object interface
 */
export interface DbFolder {
  id: string;
  title: string;
  parent_id?: string | null;
  created_time?: string;
  updated_time?: string;
}

/**
 * Database note object interface
 */
export interface DbNote {
  id: string;
  title: string;
  content: string;
  parent_id?: string | null;
  created_time?: string;
  updated_time?: string;
}

/**
 * Database tag object interface
 */
export interface DbTag {
  id: string;
  name: string;
  created_time?: string;
  updated_time?: string;
}

/**
 * Item types in the database
 */
export enum DbItemType {
  FOLDER = "folder",
  NOTE = "note",
  TAG = "tag",
}