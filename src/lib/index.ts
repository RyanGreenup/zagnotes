/**
 * Database module index
 * Re-exports all database functionality
 */

/**
 * Standard response format for database operations
 */
export interface DbResponse {
  success: boolean;
  message: string;
}

/**
 * Format an error into a standard error response
 * @param error The error object
 * @param operation Description of the operation that failed
 * @returns Standardized error response
 */
export function formatErrorResponse(error: unknown, operation: string): DbResponse {
  return {
    success: false,
    message: `Error ${operation}: ${error instanceof Error ? error.message : String(error)}`,
  };
}

// Core database connection
export { 
  getDbConnection, 
  closeDbConnection, 
  getDbStatus, 
  initializeDbSchema 
} from './db-connection';

// Note operations
export { 
  getNote,
  saveNote 
} from './db';

// Folder operations
export {
  type Folder,
  getAllFolders,
  getFolder,
  updateFolder,
  deleteFolder
} from './db-folder';

// Tree operations
export {
  type TreeNode,
  getNoteTree,
  createFolder,
  moveItem
} from './db-tree';