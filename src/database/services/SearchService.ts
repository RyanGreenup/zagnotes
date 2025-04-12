import { Note } from '../../../shared/types'
import { Database } from '../types'

export class SearchService {
  private db: Database

  constructor(db: Database) {
    this.db = db
  }

  /**
   * Search notes by title using trigram matching for partial matches
   * @param query The search query for note titles
   * @param limit Maximum number of results to return (default: 20)
   * @returns Array of notes matching the search query
   */
  public searchNotesByTitle(query: string, limit: number = 20): Note[] {
    try {
      if (!query.trim()) {
        return []
      }

      // Use the trigram FTS5 table to search titles
      // The query is wrapped in quotes and asterisks for partial matching
      const stmt = this.db.prepare(`
        SELECT n.id, n.title, n.body, n.parent_id, n.user_created_time, n.user_updated_time
        FROM notes n
        JOIN titles_fts5_trigram t ON n.id = t.id
        WHERE t.title MATCH ?
        ORDER BY rank
        LIMIT ?
      `)

      // Format the query for trigram search
      const formattedQuery = `"${query}"*`

      return stmt.all(formattedQuery, limit) as Note[]
    } catch (error) {
      console.error('Error searching notes by title:', error)
      return []
    }
  }

  /**
   * Search notes by content using porter stemming for better matching
   * @param query The search query for note content
   * @param limit Maximum number of results to return (default: 20)
   * @returns Array of notes matching the search query
   */
  public searchNotesByContent(query: string, limit: number = 20): Note[] {
    try {
      if (!query.trim()) {
        return []
      }

      // Use the porter FTS5 table to search note content
      const stmt = this.db.prepare(`
        SELECT n.id, n.title, n.body, n.parent_id, n.user_created_time, n.user_updated_time
        FROM notes n
        JOIN notes_fts5_porter p ON n.id = p.id
        WHERE p.body MATCH ?
        ORDER BY rank
        LIMIT ?
      `)

      return stmt.all(query, limit) as Note[]
    } catch (error) {
      console.error('Error searching notes by content:', error)
      return []
    }
  }

  /**
   * Search notes by both title and content
   * @param query The search query
   * @param limit Maximum number of results to return (default: 20)
   * @returns Array of notes matching the search query in either title or content
   */
  public searchNotes(query: string, limit: number = 20): Note[] {
    try {
      if (!query.trim()) {
        return []
      }

      // First search by title using trigram matching
      const titleResults = this.searchNotesByTitle(query, limit)

      // Then search by content using porter stemming
      const contentResults = this.searchNotesByContent(query, limit)

      // Combine results, removing duplicates
      const combinedResults: Note[] = []
      const seenIds = new Set<string>()

      // Add title results first (they're usually more relevant)
      for (const note of titleResults) {
        if (!seenIds.has(note.id)) {
          combinedResults.push(note)
          seenIds.add(note.id)
        }
      }

      // Add content results that aren't duplicates
      for (const note of contentResults) {
        if (!seenIds.has(note.id)) {
          combinedResults.push(note)
          seenIds.add(note.id)
        }
      }

      // Return up to the limit
      return combinedResults.slice(0, limit)
    } catch (error) {
      console.error('Error searching notes:', error)
      return []
    }
  }

  // Set up full-text search tables if they don't exist
  public setupFullTextSearch(): void {
    try {
      // Check if the FTS5 tables already exist
      const porterTableExists = this.db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='notes_fts5_porter'")
        .get()

      const trigramTableExists = this.db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='titles_fts5_trigram'")
        .get()

      // Set up porter stemming FTS for full content search
      if (!porterTableExists) {
        console.log('Setting up porter stemming full-text search tables...')

        // Create the FTS5 virtual table and related tables/triggers
        this.db.exec(`
          CREATE VIRTUAL TABLE notes_fts5_porter USING fts5(
            id,
            title,
            body,
            content='notes',
            content_rowid='rowid',
            tokenize = 'porter ascii'
          )
          /* notes_fts5_porter(id,title,body) */;
          CREATE TABLE IF NOT EXISTS 'notes_fts5_porter_data'(id INTEGER PRIMARY KEY, block BLOB);
          CREATE TABLE IF NOT EXISTS 'notes_fts5_porter_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
          CREATE TABLE IF NOT EXISTS 'notes_fts5_porter_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
          CREATE TABLE IF NOT EXISTS 'notes_fts5_porter_config'(k PRIMARY KEY, v) WITHOUT ROWID;
          CREATE TRIGGER notes_ai AFTER INSERT ON notes
            BEGIN
              INSERT INTO notes_fts5_porter(rowid, title, body)
              VALUES (new.rowid, new.title, new.body);
            END;
          CREATE TRIGGER notes_ad AFTER DELETE ON notes
            BEGIN
              INSERT INTO notes_fts5_porter(notes_fts5_porter, rowid, title, body)
              VALUES ('delete', old.rowid, old.title, old.body);
            END;
          CREATE TRIGGER notes_au AFTER UPDATE ON notes
            BEGIN
              INSERT INTO notes_fts5_porter(notes_fts5_porter, rowid, title, body)
              VALUES ('delete', old.rowid, old.title, old.body);
              INSERT INTO notes_fts5_porter(rowid, title, body)
              VALUES (new.rowid, new.title, new.body);
            END;
        `)

        // Populate the FTS table with existing notes
        this.db.exec(`
          INSERT INTO notes_fts5_porter(rowid, id, title, body)
          SELECT rowid, id, title, body FROM notes
        `)

        console.log('Porter stemming full-text search setup complete')
      }

      // Set up trigram FTS for title search with partial matching
      if (!trigramTableExists) {
        console.log('Setting up trigram title search tables...')

        // Create the trigram FTS5 virtual table and related tables/triggers for titles
        this.db.exec(`
          CREATE VIRTUAL TABLE titles_fts5_trigram USING fts5(
            id,
            title,
            content='notes',
            content_rowid='rowid',
            tokenize = 'trigram'
          )
          /* titles_fts5_trigram(id,title) */;
          CREATE TABLE IF NOT EXISTS 'titles_fts5_trigram_data'(id INTEGER PRIMARY KEY, block BLOB);
          CREATE TABLE IF NOT EXISTS 'titles_fts5_trigram_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
          CREATE TABLE IF NOT EXISTS 'titles_fts5_trigram_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
          CREATE TABLE IF NOT EXISTS 'titles_fts5_trigram_config'(k PRIMARY KEY, v) WITHOUT ROWID;
          CREATE TRIGGER notes_title_ai AFTER INSERT ON notes
            BEGIN
              INSERT INTO titles_fts5_trigram(rowid, id, title)
              VALUES (new.rowid, new.id, new.title);
            END;
          CREATE TRIGGER notes_title_ad AFTER DELETE ON notes
            BEGIN
              INSERT INTO titles_fts5_trigram(titles_fts5_trigram, rowid, id, title)
              VALUES ('delete', old.rowid, old.id, old.title);
            END;
          CREATE TRIGGER notes_title_au AFTER UPDATE ON notes
            BEGIN
              INSERT INTO titles_fts5_trigram(titles_fts5_trigram, rowid, id, title)
              VALUES ('delete', old.rowid, old.id, old.title);
              INSERT INTO titles_fts5_trigram(rowid, id, title)
              VALUES (new.rowid, new.id, new.title);
            END;
        `)

        // Populate the trigram FTS table with existing note titles
        this.db.exec(`
          INSERT INTO titles_fts5_trigram(rowid, id, title)
          SELECT rowid, id, title FROM notes
        `)

        console.log('Trigram title search setup complete')
      }
    } catch (error) {
      console.error('Error setting up full-text search:', error)
      // Don't throw the error - we want the app to continue even if FTS setup fails
    }
  }
}
