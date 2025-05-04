/**
 * Database module index
 * Re-exports all database functionality
 */

// Types
export type { DbResponse, SearchResult, Note, Folder, TreeNode } from './db/types/response';
export type { DbFolder, DbNote, DbTag, DbItemType } from './types';

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
} from './db/db';

// Folder operations
export {
  getAllFolders,
  getFolder,
} from './db/folders/read';

export {
  updateFolder,
  deleteFolder,
} from './db/folders/update';

export {
  createFolder
} from './db/folders/create';

// Tree operations
export {
  getNoteTree,
} from './db/note-tree/read';

// Note operations
export {
  getFullNote,
} from './db/notes/read';

export {
  createNote,
} from './db/notes/create';

export {
  deleteNote,
} from './db/notes/delete';

// Search operations
export {
  searchNotes
} from './db/search/search';
