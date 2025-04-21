/**
 * Database module index
 * Re-exports all database functionality
 */

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