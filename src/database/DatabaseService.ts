import { existsSync } from 'fs'
import { Note, Folder, Tag, Resource } from '../../shared/types'
import { Database, DatabaseOptions } from './types'
import { NoteService } from './services/NoteService'
import { FolderService } from './services/FolderService'
import { TagService } from './services/TagService'
import { ResourceService } from './services/ResourceService'
import { SearchService } from './services/SearchService'
import { RelationshipService } from './services/RelationshipService'

// Import better-sqlite3 with error handling
let BetterSqlite3: any
try {
  BetterSqlite3 = require('better-sqlite3')
} catch (error) {
  console.error('Failed to load better-sqlite3:', error)
}

/**
 * Main database service that coordinates all database operations
 */
export class DatabaseService {
  private db: Database
  private static instance: DatabaseService | null = null
  private dbPath: string
  
  // Service instances
  private noteService: NoteService
  private folderService: FolderService
  private tagService: TagService
  private resourceService: ResourceService
  private searchService: SearchService
  private relationshipService: RelationshipService

  private constructor(dbPath: string) {
    this.dbPath = dbPath

    if (!existsSync(dbPath)) {
      throw new Error(`Database file not found: ${dbPath}`)
    }

    if (!BetterSqlite3) {
      throw new Error(
        'better-sqlite3 module could not be loaded. Try running "npm rebuild better-sqlite3"'
      )
    }

    try {
      // Initialize the database connection
      this.db = new BetterSqlite3(dbPath, { readonly: false })
      console.log(`Connected to database: ${dbPath}`)
      
      // Initialize services
      this.noteService = new NoteService(this.db)
      this.folderService = new FolderService(this.db)
      this.tagService = new TagService(this.db)
      this.resourceService = new ResourceService(this.db)
      this.searchService = new SearchService(this.db)
      this.relationshipService = new RelationshipService(this.db)
    } catch (error) {
      console.error('Failed to connect to database:', error)
      throw error
    }
  }

  // Singleton pattern with configurable database path
  public static getInstance(dbPath: string): DatabaseService {
    // If instance exists but with different path, close it and create new one
    if (DatabaseService.instance && DatabaseService.instance.dbPath !== dbPath) {
      DatabaseService.instance.close()
      DatabaseService.instance = null
    }

    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService(dbPath)
    }
    return DatabaseService.instance
  }

  /**
   * Initialize full-text search capabilities
   */
  public initializeFullTextSearch(): boolean {
    try {
      this.searchService.setupFullTextSearch()
      return true
    } catch (error) {
      console.error('Error initializing full-text search:', error)
      return false
    }
  }

  // Close the database connection
  public close(): void {
    try {
      if (this.db) {
        this.db.close()
        console.log('Database connection closed')
      }
    } catch (error) {
      console.error('Error closing database connection:', error)
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Notes API ////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // Create
  public createNote(title: string, body: string, folderId: string = ''): Note | null {
    return this.noteService.createNote(title, body, folderId)
  }

  // Read
  public getAllNotes(): Note[] {
    return this.noteService.getAllNotes()
  }

  public getNoteById(id: string): Note | null {
    return this.noteService.getNoteById(id)
  }

  public getNoteBodyById(id: string): string | null {
    return this.noteService.getNoteBodyById(id)
  }

  public getHomeNote(): Note | null {
    return this.noteService.getHomeNote()
  }

  // Update
  public updateNoteTitle(id: string, title: string): Note | null {
    return this.noteService.updateNoteTitle(id, title)
  }

  public updateNoteBody(id: string, body: string): Note | null {
    return this.noteService.updateNoteBody(id, body)
  }

  public updateNote(id: string, title: string, body: string): Note | null {
    return this.noteService.updateNote(id, title, body)
  }

  // Delete
  public deleteNote(id: string): boolean {
    return this.noteService.deleteNote(id)
  }

  /////////////////////////////////////////////////////////////////////////////
  // Folders API //////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // Create
  public createFolder(title: string, parentId: string = ''): Folder | null {
    return this.folderService.createFolder(title, parentId)
  }

  // Read
  public getFolderById(id: string): Folder | null {
    return this.folderService.getFolderById(id)
  }

  // Update
  public updateFolder(id: string, title: string): Folder | null {
    return this.folderService.updateFolder(id, title)
  }

  public moveFolder(id: string, newParentId: string): Folder | null {
    return this.folderService.moveFolder(id, newParentId)
  }

  // Delete
  public deleteFolder(id: string, recursive: boolean = false): boolean {
    return this.folderService.deleteFolder(id, recursive)
  }

  /////////////////////////////////////////////////////////////////////////////
  // Folder-Notes API /////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  public getNotesByFolderId(folderId: string): Note[] {
    return this.folderService.getNotesByFolderId(folderId)
  }

  public moveNote(noteId: string, newFolderId: string): Note | null {
    return this.noteService.moveNote(noteId, newFolderId)
  }

  /////////////////////////////////////////////////////////////////////////////
  // Tree API /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  public buildNoteTree(): any {
    return this.folderService.buildNoteTree()
  }

  /////////////////////////////////////////////////////////////////////////////
  // Tags API /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // Create
  public createTag(title: string, parentId: string = ''): Tag | null {
    return this.tagService.createTag(title, parentId)
  }

  // Read
  public getTagById(id: string): Tag | null {
    return this.tagService.getTagById(id)
  }

  public getAllTags(): Tag[] {
    return this.tagService.getAllTags()
  }

  // Update
  public updateTag(id: string, title: string): Tag | null {
    return this.tagService.updateTag(id, title)
  }

  public moveTag(id: string, newParentId: string): Tag | null {
    return this.tagService.moveTag(id, newParentId)
  }

  // Delete
  public deleteTag(id: string): boolean {
    return this.tagService.deleteTag(id)
  }

  /////////////////////////////////////////////////////////////////////////////
  // Tag Tree API /////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  public buildTagTree(): any {
    return this.tagService.buildTagTree()
  }

  /////////////////////////////////////////////////////////////////////////////
  // Resources API ////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // Create
  public createResource(
    title: string,
    mime: string,
    filename: string,
    fileExtension: string,
    size: number
  ): Resource | null {
    return this.resourceService.createResource(title, mime, filename, fileExtension, size)
  }

  // Read
  public getResourceById(id: string): Resource | null {
    return this.resourceService.getResourceById(id)
  }

  public getAllResources(): Resource[] {
    return this.resourceService.getAllResources()
  }

  public getResourcesByMimeType(mimeType: string): Resource[] {
    return this.resourceService.getResourcesByMimeType(mimeType)
  }

  // Update
  public updateResource(id: string, title: string, filename: string): Resource | null {
    return this.resourceService.updateResource(id, title, filename)
  }

  public updateResourceOcr(
    id: string,
    ocrText: string,
    ocrStatus: number,
    ocrError: string = ''
  ): Resource | null {
    return this.resourceService.updateResourceOcr(id, ocrText, ocrStatus, ocrError)
  }

  // Delete
  public deleteResource(id: string): boolean {
    return this.resourceService.deleteResource(id)
  }

  /////////////////////////////////////////////////////////////////////////////
  // Note-Tags API ////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // Create
  public assignTagToNote(noteId: string, tagId: string): boolean {
    return this.relationshipService.assignTagToNote(noteId, tagId)
  }

  // Read
  public getTagsByNoteId(noteId: string): Tag[] {
    return this.relationshipService.getTagsByNoteId(noteId)
  }

  public getNotesByTagId(tagId: string): Note[] {
    return this.relationshipService.getNotesByTagId(tagId)
  }

  public getBacklinks(noteId: string): Note[] {
    return this.relationshipService.getBacklinks(noteId)
  }

  public getForwardLinks(noteId: string): Note[] {
    return this.relationshipService.getForwardLinks(noteId)
  }

  // Delete
  public removeTagFromNote(noteId: string, tagId: string): boolean {
    return this.relationshipService.removeTagFromNote(noteId, tagId)
  }

  /////////////////////////////////////////////////////////////////////////////
  // Search API ///////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  public searchNotesByTitle(query: string, limit: number = 20): Note[] {
    return this.searchService.searchNotesByTitle(query, limit)
  }

  public searchNotesByContent(query: string, limit: number = 20): Note[] {
    return this.searchService.searchNotesByContent(query, limit)
  }

  public searchNotes(query: string, limit: number = 20): Note[] {
    return this.searchService.searchNotes(query, limit)
  }
}
