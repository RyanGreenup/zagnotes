import { TreeNode } from "@ark-ui/solid";
import { getDbConnection } from "../db-connection";

/**
 * Get the complete tree structure of notes and folders
 * @returns The hierarchical tree structure
 */
export async function getNoteTree(): Promise<TreeNode> {
  "use server";
  const db = await getDbConnection({ readonly: true });

  try {
    return buildNoteTree(db);
  } catch (error) {
    console.error('Error fetching note tree:', error);
    // Return empty root on error
    return {
      id: 'ROOT',
      name: 'Root',
      type: 'folder',
      children: []
    };
  }
}

/**
 * Builds a hierarchical tree structure of notes and folders
 * @param db Database instance
 * @returns A tree structure with a root node containing all notes and folders
 */
function buildNoteTree(db: any): TreeNode {
  try {
    interface FolderMap {
      [id: string]: {
        id: string;
        title: string;
        name: string;
        type: "file" | "folder";
        parent_id: string;
        children: TreeNode[];
        processed?: boolean;
      }
    }

    // Fetch all folders and notes from the database
    const foldersStmt = db.prepare('SELECT id, title, parent_id FROM folders');
    const notesStmt = db.prepare('SELECT id, title, parent_id FROM notes');

    const folders = foldersStmt.all();
    const notes = notesStmt.all();

    // Create a map of folders for easy lookup
    const folderMap: FolderMap = {};
    folders.forEach((folder: any) => {
      folderMap[folder.id] = {
        id: folder.id,
        title: folder.title,
        name: folder.title || folder.id, // Use title or id as fallback
        type: 'folder',
        parent_id: folder.parent_id,
        children: []
      };
    });

    // Create the root node
    const root: TreeNode = {
      id: 'ROOT',
      name: 'Root',
      type: 'folder',
      children: []
    };

    // First pass: detect circular references
    const circularFolders = new Set<string>();

    folders.forEach((folder: any) => {
      // Check for circular references
      const visited = new Set<string>();
      let currentId = folder.id;

      while (currentId) {
        if (visited.has(currentId)) {
          // Found a circular reference
          circularFolders.add(folder.id);
          break;
        }

        visited.add(currentId);
        const parentId = folderMap[currentId]?.parent_id;
        if (!parentId || !folderMap[parentId]) break;
        currentId = parentId;
      }
    });

    // Second pass: build the actual tree structure
    folders.forEach((folder: any) => {
      const folderNode = folderMap[folder.id];
      folderNode.title = folder.title;
      folderNode.name = folder.title || folder.id; // Use title or id as fallback
      folderNode.children = folderNode.children || [];

      if (folder.parent_id && folderMap[folder.parent_id] && !circularFolders.has(folder.id)) {
        folderMap[folder.parent_id].children.push(folderNode);
      } else {
        root.children = root.children || [];
        root.children.push(folderNode);
      }
    });

    // Process notes
    notes.forEach((note: any) => {
      const noteNode: TreeNode = {
        id: note.id,
        name: note.title || note.id, // Use title or id as fallback
        type: 'file'
      };

      // If this note has a valid parent folder, add it as a child
      if (note.parent_id && folderMap[note.parent_id]) {
        // Add this note as a child of its parent folder
        folderMap[note.parent_id].children = folderMap[note.parent_id].children || [];
        folderMap[note.parent_id].children.push(noteNode);
      } else {
        // This is a root-level note or has a non-existent parent
        root.children = root.children || [];
        root.children.push(noteNode);
      }
    });

    // Clean up the tree structure by removing extra properties
    return cleanTree(root);
  } catch (error) {
    console.error('Error building note tree:', error);
    // Return an empty root node in case of error
    return {
      id: 'ROOT',
      name: 'Root',
      type: 'folder',
      children: []
    };
  }
}

/**
 * Clean the tree structure to match expected format
 * @param node Tree node to clean
 * @returns Cleaned tree node
 */
function cleanTree(node: any): TreeNode {
  if (node.children && node.children.length > 0) {
    node.children = node.children.map((child: any) => {
      if (child.children && child.children.length > 0) {
        return cleanTree(child);
      }
      return {
        id: child.id,
        name: child.name,
        type: child.type
      };
    });

    return {
      id: node.id,
      name: node.name,
      type: 'folder',
      children: node.children
    };
  } else {
    // Don't include empty children arrays
    return {
      id: node.id,
      name: node.name,
      type: node.type
    };
  }
}

