import { Note, Folder } from '../../../shared/types'
import { Database, TreeNode } from '../types'
import { generateUUID, getCurrentTimestamp } from '../utils/helpers'

export class FolderService {
  private db: Database

  constructor(db: Database) {
    this.db = db
  }

  // Create a new folder
  public createFolder(title: string, parentId: string = ''): Folder | null {
    try {
      // Generate a new UUID for the folder
      const id = generateUUID()
      const now = getCurrentTimestamp()

      // Insert the new folder into the database
      const stmt = this.db.prepare(
        'INSERT INTO folders (id, title, parent_id, created_time, updated_time, user_created_time, user_updated_time) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )

      stmt.run(id, title, parentId, now, now, now, now)

      // Return the newly created folder
      return {
        id,
        title,
        parent_id: parentId,
        user_created_time: now,
        user_updated_time: now
      }
    } catch (error) {
      console.error('Error creating new folder:', error)
      return null
    }
  }

  // Get a single folder by ID
  public getFolderById(id: string): Folder | null {
    try {
      const stmt = this.db.prepare(
        'SELECT id, title, parent_id, user_created_time, user_updated_time FROM folders WHERE id = ?'
      )
      return (stmt.get(id) as Folder) || null
    } catch (error) {
      console.error(`Error fetching folder with ID ${id}:`, error)
      return null
    }
  }

  // Update an existing folder
  public updateFolder(id: string, title: string): Folder | null {
    try {
      const now = getCurrentTimestamp()

      // Check if the folder exists
      const existingFolder = this.getFolderById(id)
      if (!existingFolder) {
        console.error(`Cannot update folder: Folder with ID ${id} not found`)
        return null
      }

      // Update the folder in the database
      const stmt = this.db.prepare(
        'UPDATE folders SET title = ?, updated_time = ?, user_updated_time = ? WHERE id = ?'
      )

      const result = stmt.run(title, now, now, id)

      if (result.changes === 0) {
        console.error(`No changes made to folder with ID ${id}`)
        return null
      }

      // Return the updated folder
      return {
        id,
        title,
        parent_id: existingFolder.parent_id,
        user_created_time: existingFolder.user_created_time,
        user_updated_time: now
      }
    } catch (error) {
      console.error(`Error updating folder with ID ${id}:`, error)
      return null
    }
  }

  // Move a folder to a different parent folder
  public moveFolder(id: string, newParentId: string): Folder | null {
    try {
      const now = getCurrentTimestamp()

      // Check if the folder exists
      const existingFolder = this.getFolderById(id)
      if (!existingFolder) {
        console.error(`Cannot move folder: Folder with ID ${id} not found`)
        return null
      }

      // Prevent a folder from being its own parent
      if (id === newParentId) {
        console.error(`Cannot move folder: A folder cannot be its own parent`)
        return null
      }

      // Update the folder's parent_id in the database
      const stmt = this.db.prepare(
        'UPDATE folders SET parent_id = ?, updated_time = ?, user_updated_time = ? WHERE id = ?'
      )

      const result = stmt.run(newParentId, now, now, id)

      if (result.changes === 0) {
        console.error(`No changes made to folder with ID ${id}`)
        return null
      }

      // Return the updated folder
      return {
        id,
        title: existingFolder.title,
        parent_id: newParentId,
        user_created_time: existingFolder.user_created_time,
        user_updated_time: now
      }
    } catch (error) {
      console.error(`Error moving folder with ID ${id}:`, error)
      return null
    }
  }

  // Delete a folder and all its notes
  public deleteFolder(id: string, recursive: boolean = false): boolean {
    try {
      // Get the folder first to check if it exists
      const folderStmt = this.db.prepare('SELECT id, title, parent_id, user_created_time, user_updated_time FROM folders WHERE id = ?')
      const existingFolder = folderStmt.get(id)

      if (!existingFolder) {
        console.error(`Cannot delete folder: Folder with ID ${id} not found`)
        return false
      }

      // If recursive is true, delete all child folders first
      if (recursive) {
        // Find all child folders
        const childFoldersStmt = this.db.prepare('SELECT id FROM folders WHERE parent_id = ?')
        const childFolders = childFoldersStmt.all(id)

        // Recursively delete each child folder
        for (const childFolder of childFolders) {
          // Delete notes in child folder
          const deleteChildNotesStmt = this.db.prepare('DELETE FROM notes WHERE parent_id = ?')
          deleteChildNotesStmt.run(childFolder.id)

          // Delete the child folder itself
          const deleteChildFolderStmt = this.db.prepare('DELETE FROM folders WHERE id = ?')
          deleteChildFolderStmt.run(childFolder.id)

          // Also check for nested child folders
          this.deleteFolder(childFolder.id, true)
        }
      }

      // Delete all notes with this folder as parent
      const deleteNotesStmt = this.db.prepare('DELETE FROM notes WHERE parent_id = ?')
      deleteNotesStmt.run(id)

      // Delete the folder itself
      const deleteFolderStmt = this.db.prepare('DELETE FROM folders WHERE id = ?')
      const result = deleteFolderStmt.run(id)

      if (result.changes === 0) {
        console.error(`No folder deleted with ID ${id}`)
        return false
      }

      return true
    } catch (error) {
      console.error(`Error deleting folder with ID ${id}:`, error)
      return false
    }
  }

  // Get all notes in a specific folder
  public getNotesByFolderId(folderId: string): Note[] {
    try {
      const stmt = this.db.prepare(
        'SELECT id, title, body, parent_id, user_created_time, user_updated_time FROM notes WHERE parent_id = ?'
      )
      return stmt.all(folderId) as Note[]
    } catch (error) {
      console.error(`Error fetching notes for folder ID ${folderId}:`, error)
      return []
    }
  }

  /**
   * Builds a hierarchical tree structure of notes and folders
   * @returns A tree structure with a root node containing all notes and folders
   */
  public buildNoteTree(): TreeNode {
    try {
      interface FolderMap {
        [id: string]: {
          id: string
          title: string
          name: string // Add name property to match TreeNode interface
          type: "file" | "folder"
          parent_id: string
          children: TreeNode[]
          processed?: boolean
        }
      }

      // Fetch all folders and notes from the database
      const foldersStmt = this.db.prepare('SELECT id, title, parent_id FROM folders')
      const notesStmt = this.db.prepare('SELECT id, title, parent_id FROM notes')

      const folders = foldersStmt.all()
      const notes = notesStmt.all()

      // Create a map of folders for easy lookup
      const folderMap: FolderMap = {}
      folders.forEach((folder: any) => {
        folderMap[folder.id] = {
          id: folder.id,
          title: folder.title,
          name: folder.title, // Add name property to match TreeNode interface
          type: 'folder',
          parent_id: folder.parent_id,
          children: []
        }
      })

      // Create the root node
      const root: TreeNode = {
        id: 'ROOT',
        name: '',
        type: 'folder',
        children: []
      }

      // First pass: detect circular references
      const circularFolders = new Set<string>()

      folders.forEach((folder: any) => {
        // Check for circular references
        const visited = new Set<string>()
        let currentId = folder.id

        while (currentId) {
          if (visited.has(currentId)) {
            // Found a circular reference
            circularFolders.add(folder.id)
            break
          }

          visited.add(currentId)
          const parentId = folderMap[currentId]?.parent_id
          if (!parentId || !folderMap[parentId]) break
          currentId = parentId
        }
      })

      // Second pass: build the actual tree structure
      folders.forEach((folder: any) => {
        const folderNode = folderMap[folder.id]
        folderNode.title = folder.title
        folderNode.name = folder.title // Ensure name is set to match TreeNode interface
        folderNode.children = folderNode.children || []

        if (folder.parent_id && folderMap[folder.parent_id] && !circularFolders.has(folder.id)) {
          folderMap[folder.parent_id].children.push(folderNode)
        } else {
          root.children!.push(folderNode)
        }
      })

      // Process notes
      notes.forEach((note: any) => {
        const noteNode: TreeNode = {
          id: note.id,
          name: note.title,
          type: 'file'
        }

        // If this note has a valid parent folder, add it as a child
        if (note.parent_id && folderMap[note.parent_id]) {
          // Add this note as a child of its parent folder
          if (!folderMap[note.parent_id].children) {
            folderMap[note.parent_id].children = []
          }
          folderMap[note.parent_id].children.push(noteNode)
        } else {
          // This is a root-level note or has a non-existent parent
          root.children!.push(noteNode)
        }
      })

      // Clean up the tree structure to match expected format in tests
      // by removing extra properties from folder nodes
      const cleanTree = (node: any): TreeNode => {
        if (node.children && node.children.length > 0) {
          node.children = node.children.map((child: any) => {
            if (child.children && child.children.length > 0) {
              return cleanTree(child);
            }
            return {
              id: child.id,
              name: child.name,
              type: child.children ? 'folder' : 'file'
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
            type: node.children ? 'folder' : 'file'
          };
        }
      };

      return cleanTree(root);
    } catch (error) {
      console.error('Error building note tree:', error)
      // Return an empty root node in case of error
      return {
        id: 'ROOT',
        name: '',
        type: 'folder',
        children: []
      }
    }
  }
}
