import { Tag } from '../../../shared/types'
import { Database, TreeNode } from '../types'
import { generateUUID, getCurrentTimestamp } from '../utils/helpers'

export class TagService {
  private db: Database

  constructor(db: Database) {
    this.db = db
  }

  /**
   * Creates a new tag in the database
   * @param title The title of the tag
   * @param parentId Optional parent tag ID
   * @returns The newly created tag or null if creation failed
   */
  public createTag(title: string, parentId: string = ''): Tag | null {
    try {
      // Generate a new UUID for the tag
      const id = generateUUID()
      const now = getCurrentTimestamp()

      // Insert the new tag into the database
      const stmt = this.db.prepare(
        'INSERT INTO tags (id, title, parent_id, created_time, updated_time, user_created_time, user_updated_time) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )

      stmt.run(id, title, parentId, now, now, now, now)

      // Return the newly created tag
      return {
        id,
        title,
        parent_id: parentId,
        user_created_time: now,
        user_updated_time: now
      }
    } catch (error) {
      console.error('Error creating new tag:', error)
      return null
    }
  }

  /**
   * Gets a tag by its ID
   * @param id The ID of the tag to retrieve
   * @returns The tag or null if not found
   */
  public getTagById(id: string): Tag | null {
    try {
      const stmt = this.db.prepare(
        'SELECT id, title, parent_id, user_created_time, user_updated_time FROM tags WHERE id = ?'
      )
      return (stmt.get(id) as Tag) || null
    } catch (error) {
      console.error(`Error fetching tag with ID ${id}:`, error)
      return null
    }
  }

  /**
   * Gets all tags from the database
   * @returns Array of all tags
   */
  public getAllTags(): Tag[] {
    try {
      const stmt = this.db.prepare(
        'SELECT id, title, parent_id, user_created_time, user_updated_time FROM tags'
      )
      return stmt.all() as Tag[]
    } catch (error) {
      console.error('Error fetching all tags:', error)
      return []
    }
  }

  /**
   * Updates the title of a tag
   * @param id The ID of the tag to update
   * @param title The new title for the tag
   * @returns The updated tag or null if update failed
   */
  public updateTag(id: string, title: string): Tag | null {
    try {
      const now = getCurrentTimestamp()

      // Check if the tag exists
      const existingTag = this.getTagById(id)
      if (!existingTag) {
        console.error(`Cannot update tag: Tag with ID ${id} not found`)
        return null
      }

      // Update the tag in the database
      const stmt = this.db.prepare(
        'UPDATE tags SET title = ?, updated_time = ?, user_updated_time = ? WHERE id = ?'
      )

      const result = stmt.run(title, now, now, id)

      if (result.changes === 0) {
        console.error(`No changes made to tag with ID ${id}`)
        return null
      }

      // Return the updated tag
      return {
        id,
        title,
        parent_id: existingTag.parent_id,
        user_created_time: existingTag.user_created_time,
        user_updated_time: now
      }
    } catch (error) {
      console.error(`Error updating tag with ID ${id}:`, error)
      return null
    }
  }

  /**
   * Moves a tag to a new parent tag
   * @param id The ID of the tag to move
   * @param newParentId The ID of the new parent tag, or empty string for root level
   * @returns The updated tag or null if the move failed
   */
  public moveTag(id: string, newParentId: string): Tag | null {
    try {
      const now = getCurrentTimestamp()

      // Check if the tag exists
      const existingTag = this.getTagById(id)
      if (!existingTag) {
        console.error(`Cannot move tag: Tag with ID ${id} not found`)
        return null
      }

      // Prevent a tag from being its own parent
      if (id === newParentId) {
        console.error(`Cannot move tag: A tag cannot be its own parent`)
        return null
      }

      // Update the tag's parent_id in the database
      const stmt = this.db.prepare(
        'UPDATE tags SET parent_id = ?, updated_time = ?, user_updated_time = ? WHERE id = ?'
      )

      const result = stmt.run(newParentId, now, now, id)

      if (result.changes === 0) {
        console.error(`No changes made to tag with ID ${id}`)
        return null
      }

      // Return the updated tag
      return {
        id,
        title: existingTag.title,
        parent_id: newParentId,
        user_created_time: existingTag.user_created_time,
        user_updated_time: now
      }
    } catch (error) {
      console.error(`Error moving tag with ID ${id}:`, error)
      return null
    }
  }

  /**
   * Deletes a tag from the database
   * @param id The ID of the tag to delete
   * @returns True if the tag was deleted successfully, false otherwise
   */
  public deleteTag(id: string): boolean {
    try {
      // Check if the tag exists
      const existingTag = this.getTagById(id)
      if (!existingTag) {
        console.error(`Cannot delete tag: Tag with ID ${id} not found`)
        return false
      }

      // Delete the tag from the database
      const stmt = this.db.prepare('DELETE FROM tags WHERE id = ?')
      const result = stmt.run(id)

      if (result.changes === 0) {
        console.error(`No tag deleted with ID ${id}`)
        return false
      }

      return true
    } catch (error) {
      console.error(`Error deleting tag with ID ${id}:`, error)
      return false
    }
  }

  /**
   * Builds a hierarchical tree structure of tags
   * @returns A tree structure with a root node containing all tags
   */
  public buildTagTree(): TreeNode {
    try {
      interface TagMap {
        [id: string]: {
          id: string
          title: string
          parent_id: string
          type: "file" | "folder"
          children: TreeNode[]
        }
      }

      // Fetch all tags from the database
      const tags = this.getAllTags()

      // Create a map of tags for easy lookup
      const tagMap: TagMap = {}
      tags.forEach((tag) => {
        tagMap[tag.id] = {
          id: tag.id,
          title: tag.title,
          parent_id: tag.parent_id,
          type: 'folder',
          children: []
        }
      })

      // Create the root node
      const root: TreeNode = {
        id: 'ROOT',
        name: 'Tags',
        type: 'folder',
        children: []
      }

      // First pass: detect circular references
      const circularTags = new Set<string>()

      tags.forEach((tag) => {
        // Check for circular references
        const visited = new Set<string>()
        let currentId = tag.id

        while (currentId) {
          if (visited.has(currentId)) {
            // Found a circular reference
            circularTags.add(tag.id)
            break
          }

          visited.add(currentId)
          const parentId = tagMap[currentId]?.parent_id
          if (!parentId || !tagMap[parentId]) break
          currentId = parentId
        }
      })

      // Second pass: build the actual tree structure
      tags.forEach((tag) => {
        const tagNode: TreeNode = {
          id: tag.id,
          name: tag.title,
          type: 'folder'
        }

        // If this tag has a valid parent and is not part of a circular reference
        if (tag.parent_id && tagMap[tag.parent_id] && !circularTags.has(tag.id)) {
          // Add this tag as a child of its parent
          if (!tagMap[tag.parent_id].children) {
            tagMap[tag.parent_id].children = []
          }
          tagMap[tag.parent_id].children.push(tagNode)
        } else {
          // This is a root-level tag or part of a circular reference
          root.children!.push(tagNode)
        }
      })

      // Add children arrays to tag nodes that need them
      tags.forEach((tag) => {
        const tagNode = tagMap[tag.id]
        if (tagNode && tagNode.children && tagNode.children.length > 0) {
          // Find this tag in the tree and add its children
          const addChildrenToNode = (node: TreeNode): boolean => {
            if (node.id === tag.id) {
              node.children = tagNode.children
              return true
            }

            if (node.children) {
              for (const child of node.children) {
                if (addChildrenToNode(child)) {
                  return true
                }
              }
            }

            return false
          }

          // Start from root to find and update the tag
          addChildrenToNode(root)
        }
      })

      return root
    } catch (error) {
      console.error('Error building tag tree:', error)
      // Return an empty root node in case of error
      return {
        id: 'ROOT',
        name: 'Tags',
        type: 'folder',
        children: []
      }
    }
  }
}
