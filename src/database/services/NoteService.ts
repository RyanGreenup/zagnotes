import { Note } from '../../../shared/types'
import { Database } from '../types'
import { generateUUID, getCurrentTimestamp } from '../utils/helpers'

export class NoteService {
  private db: Database

  constructor(db: Database) {
    this.db = db
  }

  // Create a new note
  public createNote(title: string, body: string, folderId: string = ''): Note | null {
    try {
      // Generate a new UUID for the note
      const id = generateUUID()
      const now = getCurrentTimestamp()

      // Insert the new note into the database
      const stmt = this.db.prepare(
        'INSERT INTO notes (id, title, body, parent_id, user_created_time, user_updated_time) VALUES (?, ?, ?, ?, ?, ?)'
      )

      stmt.run(id, title, body, folderId, now, now)

      // Return the newly created note
      return {
        id,
        title,
        body,
        parent_id: folderId,
        user_created_time: now,
        user_updated_time: now
      }
    } catch (error) {
      console.error('Error creating new note:', error)
      return null
    }
  }

  // Get all notes from the database
  public getAllNotes(): Note[] {
    try {
      const stmt = this.db.prepare(
        'SELECT id, title, body, parent_id, user_created_time, user_updated_time FROM notes'
      )
      return stmt.all() as Note[]
    } catch (error) {
      console.error('Error fetching notes:', error)
      return []
    }
  }

  // Get a single note by ID
  public getNoteById(id: string): Note | null {
    try {
      const stmt = this.db.prepare(
        'SELECT id, title, body, parent_id, user_created_time, user_updated_time FROM notes WHERE id = ?'
      )
      return (stmt.get(id) as Note) || null
    } catch (error) {
      console.error(`Error fetching note with ID ${id}:`, error)
      return null
    }
  }

  // Get the body of a note based on its id
  public getNoteBodyById(id: string): string | null {
    try {
      const stmt = this.db.prepare('SELECT body FROM notes WHERE id = ?')
      const result = stmt.get(id)
      return result ? result.body : null
    } catch (error) {
      console.error(`Error fetching content of note with ID ${id}:`, error)
      return null
    }
  }

  // Get the home note (most recently updated note with title "Homepage")
  public getHomeNote(): Note | null {
    try {
      const stmt = this.db.prepare(
        'SELECT id, title, body, parent_id, user_created_time, user_updated_time FROM notes WHERE title = ? ORDER BY user_updated_time DESC LIMIT 1'
      )
      return (stmt.get('Homepage') as Note) || null
    } catch (error) {
      console.error('Error fetching home note:', error)
      return null
    }
  }

  // Update an existing note's title
  public updateNoteTitle(id: string, title: string): Note | null {
    try {
      const now = getCurrentTimestamp()

      // Check if the note exists
      const existingNote = this.getNoteById(id)
      if (!existingNote) {
        console.error(`Cannot update note title: Note with ID ${id} not found`)
        return null
      }

      // Update the note title in the database
      const stmt = this.db.prepare('UPDATE notes SET title = ?, user_updated_time = ? WHERE id = ?')

      const result = stmt.run(title, now, id)

      if (result.changes === 0) {
        console.error(`No changes made to note title with ID ${id}`)
        return null
      }

      // Return the updated note
      return {
        id,
        title,
        body: existingNote.body,
        parent_id: existingNote.parent_id,
        user_created_time: existingNote.user_created_time,
        user_updated_time: now
      }
    } catch (error) {
      console.error(`Error updating note title with ID ${id}:`, error)
      return null
    }
  }

  // Update an existing note's body
  public updateNoteBody(id: string, body: string): Note | null {
    try {
      const now = getCurrentTimestamp()

      // Check if the note exists
      const existingNote = this.getNoteById(id)
      if (!existingNote) {
        console.error(`Cannot update note body: Note with ID ${id} not found`)
        return null
      }

      // Update the note body in the database
      const stmt = this.db.prepare('UPDATE notes SET body = ?, user_updated_time = ? WHERE id = ?')

      const result = stmt.run(body, now, id)

      if (result.changes === 0) {
        console.error(`No changes made to note body with ID ${id}`)
        return null
      }

      // Return the updated note
      return {
        id,
        title: existingNote.title,
        body,
        parent_id: existingNote.parent_id,
        user_created_time: existingNote.user_created_time,
        user_updated_time: now
      }
    } catch (error) {
      console.error(`Error updating note body with ID ${id}:`, error)
      return null
    }
  }

  // Update an existing note (both title and body)
  public updateNote(id: string, title: string, body: string): Note | null {
    try {
      const now = getCurrentTimestamp()

      // Check if the note exists
      const existingNote = this.getNoteById(id)
      if (!existingNote) {
        console.error(`Cannot update note: Note with ID ${id} not found`)
        return null
      }

      // Update the note in the database
      const stmt = this.db.prepare(
        'UPDATE notes SET title = ?, body = ?, user_updated_time = ? WHERE id = ?'
      )

      const result = stmt.run(title, body, now, id)

      if (result.changes === 0) {
        console.error(`No changes made to note with ID ${id}`)
        return null
      }

      // Return the updated note
      return {
        id,
        title,
        body,
        parent_id: existingNote.parent_id,
        user_created_time: existingNote.user_created_time,
        user_updated_time: now
      }
    } catch (error) {
      console.error(`Error updating note with ID ${id}:`, error)
      return null
    }
  }

  // Delete a note by ID
  public deleteNote(id: string): boolean {
    try {
      // Check if the note exists
      const existingNote = this.getNoteById(id)
      if (!existingNote) {
        console.error(`Cannot delete note: Note with ID ${id} not found`)
        return false
      }

      // Delete the note from the database
      const stmt = this.db.prepare('DELETE FROM notes WHERE id = ?')
      const result = stmt.run(id)

      if (result.changes === 0) {
        console.error(`No note deleted with ID ${id}`)
        return false
      }

      return true
    } catch (error) {
      console.error(`Error deleting note with ID ${id}:`, error)
      return false
    }
  }

  // Move a note to a different folder
  public moveNote(noteId: string, newFolderId: string): Note | null {
    try {
      // Check if the note exists
      const existingNote = this.getNoteById(noteId)
      if (!existingNote) {
        console.error(`Cannot move note: Note with ID ${noteId} not found`)
        return null
      }

      const now = getCurrentTimestamp()

      // Update the note's parent_id in the database
      const stmt = this.db.prepare(
        'UPDATE notes SET parent_id = ?, user_updated_time = ? WHERE id = ?'
      )

      const result = stmt.run(newFolderId, now, noteId)

      if (result.changes === 0) {
        console.error(`No changes made to note with ID ${noteId}`)
        return null
      }

      // Return the updated note
      return {
        id: noteId,
        title: existingNote.title,
        body: existingNote.body,
        parent_id: newFolderId,
        user_created_time: existingNote.user_created_time,
        user_updated_time: now
      }
    } catch (error) {
      console.error(`Error moving note with ID ${noteId}:`, error)
      return null
    }
  }
}
