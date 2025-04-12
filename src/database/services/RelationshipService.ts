import { Note, Tag } from '../../../shared/types'
import { Database } from '../types'
import { getCurrentTimestamp } from '../utils/helpers'

export class RelationshipService {
  private db: Database

  constructor(db: Database) {
    this.db = db
  }

  /**
   * Assigns a tag to a note
   * @param noteId The ID of the note
   * @param tagId The ID of the tag
   * @returns True if the tag was successfully assigned to the note, false otherwise
   */
  public assignTagToNote(noteId: string, tagId: string): boolean {
    try {
      // Check if the note exists using a direct query
      const noteStmt = this.db.prepare(
        'SELECT id, title, body, parent_id, user_created_time, user_updated_time FROM notes WHERE id = ?'
      )
      const note = noteStmt.get(noteId)

      if (!note) {
        console.error(`Cannot assign tag: Note with ID ${noteId} not found`)
        return false
      }

      // Check if the tag exists using a direct query
      const tagStmt = this.db.prepare(
        'SELECT id, title, parent_id, user_created_time, user_updated_time FROM tags WHERE id = ?'
      )
      const tag = tagStmt.get(tagId)

      if (!tag) {
        console.error(`Cannot assign tag: Tag with ID ${tagId} not found`)
        return false
      }

      const now = getCurrentTimestamp()

      // Insert the relationship into the note_tags table
      const stmt = this.db.prepare(
        'INSERT INTO note_tags (note_id, tag_id, created_time, updated_time, user_created_time, user_updated_time) VALUES (?, ?, ?, ?, ?, ?)'
      )

      stmt.run(noteId, tagId, now, now, now, now)

      return true
    } catch (error) {
      console.error(`Error assigning tag ${tagId} to note ${noteId}:`, error)
      return false
    }
  }

  /**
   * Gets all tags assigned to a specific note
   * @param noteId The ID of the note
   * @returns Array of tags assigned to the note
   */
  public getTagsByNoteId(noteId: string): Tag[] {
    try {
      // Check if the note exists using a direct query to avoid multiple prepare calls
      const noteStmt = this.db.prepare(
        'SELECT id, title, body, parent_id, user_created_time, user_updated_time FROM notes WHERE id = ?'
      )
      const note = noteStmt.get(noteId)

      if (!note) {
        console.error(`Cannot get tags: Note with ID ${noteId} not found`)
        return []
      }

      // Get all tags assigned to this note
      const stmt = this.db.prepare(`
        SELECT t.id, t.title, t.parent_id, t.user_created_time, t.user_updated_time
        FROM tags t
        JOIN note_tags nt ON t.id = nt.tag_id
        WHERE nt.note_id = ?
      `)

      return stmt.all(noteId) as Tag[]
    } catch (error) {
      console.error(`Error fetching tags for note with ID ${noteId}:`, error)
      return []
    }
  }

  /**
   * Gets all notes that have a specific tag
   * @param tagId The ID of the tag
   * @returns Array of notes that have the specified tag
   */
  public getNotesByTagId(tagId: string): Note[] {
    try {
      // Check if the tag exists
      const tagStmt = this.db.prepare(
        'SELECT id, title, parent_id, user_created_time, user_updated_time FROM tags WHERE id = ?'
      )
      const tag = tagStmt.get(tagId)

      if (!tag) {
        console.error(`Cannot get notes: Tag with ID ${tagId} not found`)
        return []
      }

      // Get all notes that have this tag
      const stmt = this.db.prepare(`
        SELECT n.id, n.title, n.body, n.parent_id, n.user_created_time, n.user_updated_time
        FROM notes n
        JOIN note_tags nt ON n.id = nt.note_id
        WHERE nt.tag_id = ?
      `)

      return stmt.all(tagId) as Note[]
    } catch (error) {
      console.error(`Error fetching notes for tag with ID ${tagId}:`, error)
      return []
    }
  }

  /**
   * Gets all notes that link to a specific note (backlinks)
   * @param noteId The ID of the note to find backlinks for
   * @returns Array of notes that contain references to the specified note
   */
  public getBacklinks(noteId: string): Note[] {
    try {
      // Check if the note exists
      const noteStmt = this.db.prepare(
        'SELECT id, title, body, parent_id, user_created_time, user_updated_time FROM notes WHERE id = ?'
      )
      const note = noteStmt.get(noteId)

      if (!note) {
        console.error(`Cannot get backlinks: Note with ID ${noteId} not found`)
        return []
      }

      // Find all notes that contain the noteId in their body
      // This uses a simple LIKE query to find the ID in the body text
      const stmt = this.db.prepare(`
        SELECT id, title, body, parent_id, user_created_time, user_updated_time
        FROM notes
        WHERE body LIKE ? AND id != ?
      `)

      // Use % wildcards to find the ID anywhere in the body text
      return stmt.all(`%${noteId}%`, noteId) as Note[]
    } catch (error) {
      console.error(`Error fetching backlinks for note with ID ${noteId}:`, error)
      return []
    }
  }

  /**
   * Gets all notes that a specific note links to (forward links)
   * @param noteId The ID of the note to find forward links from
   * @returns Array of notes that are referenced by the specified note
   */
  public getForwardLinks(noteId: string): Note[] {
    try {
      // Check if the note exists
      const noteStmt = this.db.prepare(
        'SELECT id, title, body, parent_id, user_created_time, user_updated_time FROM notes WHERE id = ?'
      )
      const note = noteStmt.get(noteId)

      if (!note) {
        console.error(`Cannot get forward links: Note with ID ${noteId} not found`)
        return []
      }

      // Extract all potential UUIDs from the note body
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where x is any hex digit and y is 8, 9, a, or b
      const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi
      const potentialIds = [...note.body.matchAll(uuidRegex)].map((match) => match[0])

      if (potentialIds.length === 0) {
        return []
      }

      // Create a parameterized query with the right number of placeholders
      const placeholders = potentialIds.map(() => '?').join(',')
      const stmt = this.db.prepare(`
        SELECT id, title, body, parent_id, user_created_time, user_updated_time
        FROM notes
        WHERE id IN (${placeholders})
      `)

      // Execute the query with all potential IDs as parameters
      return stmt.all(...potentialIds) as Note[]
    } catch (error) {
      console.error(`Error fetching forward links for note with ID ${noteId}:`, error)
      return []
    }
  }

  /**
   * Removes a tag from a note
   * @param noteId The ID of the note
   * @param tagId The ID of the tag to remove
   * @returns True if the tag was successfully removed from the note, false otherwise
   */
  public removeTagFromNote(noteId: string, tagId: string): boolean {
    try {
      // Check if the note exists using a direct query
      const noteStmt = this.db.prepare(
        'SELECT id, title, body, parent_id, user_created_time, user_updated_time FROM notes WHERE id = ?'
      )
      const note = noteStmt.get(noteId)

      if (!note) {
        console.error(`Cannot remove tag: Note with ID ${noteId} not found`)
        return false
      }

      // Check if the tag exists using a direct query
      const tagStmt = this.db.prepare(
        'SELECT id, title, parent_id, user_created_time, user_updated_time FROM tags WHERE id = ?'
      )
      const tag = tagStmt.get(tagId)

      if (!tag) {
        console.error(`Cannot remove tag: Tag with ID ${tagId} not found`)
        return false
      }

      // Delete the relationship from the note_tags table
      const stmt = this.db.prepare('DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?')

      const result = stmt.run(noteId, tagId)

      if (result.changes === 0) {
        console.error(`No tag-note relationship found for note ${noteId} and tag ${tagId}`)
        return false
      }

      return true
    } catch (error) {
      console.error(`Error removing tag ${tagId} from note ${noteId}:`, error)
      return false
    }
  }
}
