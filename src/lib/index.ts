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
} from './db/db-connection';

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
  deleteFolder,
  createFolder
} from './db-folder';

// Tree operations
export {
  type TreeNode,
  getNoteTree,
  moveItem
} from './db/note-tree/db-tree';

// Note operations
export {
  type Note,
  type SearchResult,
  createNote,
  getFullNote,
  deleteNote,
  searchNotes
} from './db-notes';
