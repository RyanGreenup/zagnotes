/**
 * Standard response format for database operations
 */
export interface DbResponse {
  success: boolean;
  message: string;
}

/**
 * Note interface
 */
export interface Note {
  id: string;
  title: string;
  body: string;
  parent_id?: string | null;
  created_time?: string;
  updated_time?: string;
}

/**
 * Search result interface
 */
export interface SearchResult extends Note {
  score: number;
}



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
 * Tree node interface
 */
export interface TreeNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: TreeNode[];
}

