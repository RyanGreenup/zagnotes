import { Resource } from '../../../shared/types'
import { Database } from '../types'
import { generateUUID, getCurrentTimestamp } from '../utils/helpers'

export class ResourceService {
  private db: Database

  constructor(db: Database) {
    this.db = db
  }

  /**
   * Creates a new resource in the database
   * @param title The title of the resource
   * @param mime The MIME type of the resource
   * @param filename The filename of the resource
   * @param fileExtension The file extension of the resource
   * @param size The size of the resource in bytes
   * @returns The newly created resource or null if creation failed
   */
  public createResource(
    title: string,
    mime: string,
    filename: string,
    fileExtension: string,
    size: number
  ): Resource | null {
    try {
      // Generate a new UUID for the resource
      const id = generateUUID()
      const now = getCurrentTimestamp()

      // Insert the new resource into the database
      const stmt = this.db.prepare(`
        INSERT INTO resources (
          id, title, mime, filename, created_time, updated_time,
          user_created_time, user_updated_time, file_extension,
          encryption_cipher_text, encryption_applied, encryption_blob_encrypted,
          size, is_shared, share_id, master_key_id, user_data,
          blob_updated_time, ocr_text, ocr_details, ocr_status, ocr_error
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?,
          '', 0, 0,
          ?, 0, '', '', '',
          ?, '', '', 0, ''
        )
      `)

      stmt.run(id, title, mime, filename, now, now, now, now, fileExtension, size, now)

      // Return the newly created resource
      return {
        id,
        title,
        mime,
        filename,
        created_time: now,
        updated_time: now,
        user_created_time: now,
        user_updated_time: now,
        file_extension: fileExtension,
        encryption_cipher_text: '',
        encryption_applied: 0,
        encryption_blob_encrypted: 0,
        size,
        is_shared: 0,
        share_id: '',
        master_key_id: '',
        user_data: '',
        blob_updated_time: now,
        ocr_text: '',
        ocr_details: '',
        ocr_status: 0,
        ocr_error: ''
      }
    } catch (error) {
      console.error('Error creating new resource:', error)
      return null
    }
  }

  /**
   * Gets a resource by its ID
   * @param id The ID of the resource to retrieve
   * @returns The resource or null if not found
   */
  public getResourceById(id: string): Resource | null {
    try {
      const stmt = this.db.prepare(`
        SELECT id, title, mime, filename, created_time, updated_time,
               user_created_time, user_updated_time, file_extension,
               encryption_cipher_text, encryption_applied, encryption_blob_encrypted,
               size, is_shared, share_id, master_key_id, user_data,
               blob_updated_time, ocr_text, ocr_details, ocr_status, ocr_error
        FROM resources
        WHERE id = ?
      `)
      return (stmt.get(id) as Resource) || null
    } catch (error) {
      console.error(`Error fetching resource with ID ${id}:`, error)
      return null
    }
  }

  /**
   * Gets all resources from the database
   * @returns Array of all resources
   */
  public getAllResources(): Resource[] {
    try {
      const stmt = this.db.prepare(`
        SELECT id, title, mime, filename, created_time, updated_time,
               user_created_time, user_updated_time, file_extension,
               encryption_cipher_text, encryption_applied, encryption_blob_encrypted,
               size, is_shared, share_id, master_key_id, user_data,
               blob_updated_time, ocr_text, ocr_details, ocr_status, ocr_error
        FROM resources
      `)
      return stmt.all() as Resource[]
    } catch (error) {
      console.error('Error fetching all resources:', error)
      return []
    }
  }

  /**
   * Gets resources by MIME type
   * @param mimeType The MIME type to filter by
   * @returns Array of resources with the specified MIME type
   */
  public getResourcesByMimeType(mimeType: string): Resource[] {
    try {
      const stmt = this.db.prepare(`
        SELECT id, title, mime, filename, created_time, updated_time,
               user_created_time, user_updated_time, file_extension,
               encryption_cipher_text, encryption_applied, encryption_blob_encrypted,
               size, is_shared, share_id, master_key_id, user_data,
               blob_updated_time, ocr_text, ocr_details, ocr_status, ocr_error
        FROM resources
        WHERE mime = ?
      `)
      return stmt.all(mimeType) as Resource[]
    } catch (error) {
      console.error(`Error fetching resources with MIME type ${mimeType}:`, error)
      return []
    }
  }

  /**
   * Updates a resource in the database
   * @param id The ID of the resource to update
   * @param title The new title for the resource
   * @param filename The new filename for the resource
   * @returns The updated resource or null if update failed
   */
  public updateResource(id: string, title: string, filename: string): Resource | null {
    try {
      const now = getCurrentTimestamp()

      // Check if the resource exists
      const existingResource = this.getResourceById(id)
      if (!existingResource) {
        console.error(`Cannot update resource: Resource with ID ${id} not found`)
        return null
      }

      // Update the resource in the database
      const stmt = this.db.prepare(`
        UPDATE resources
        SET title = ?, filename = ?, updated_time = ?, user_updated_time = ?
        WHERE id = ?
      `)

      const result = stmt.run(title, filename, now, now, id)

      if (result.changes === 0) {
        console.error(`No changes made to resource with ID ${id}`)
        return null
      }

      // Return the updated resource
      return {
        ...existingResource,
        title,
        filename,
        updated_time: now,
        user_updated_time: now
      }
    } catch (error) {
      console.error(`Error updating resource with ID ${id}:`, error)
      return null
    }
  }

  /**
   * Updates the OCR text for a resource
   * @param id The ID of the resource to update
   * @param ocrText The OCR text to set
   * @param ocrStatus The OCR status (0 = not processed, 1 = processing, 2 = done, 3 = error)
   * @param ocrError Optional error message if OCR failed
   * @returns The updated resource or null if update failed
   */
  public updateResourceOcr(
    id: string,
    ocrText: string,
    ocrStatus: number,
    ocrError: string = ''
  ): Resource | null {
    try {
      const now = getCurrentTimestamp()

      // Check if the resource exists
      const existingResource = this.getResourceById(id)
      if (!existingResource) {
        console.error(`Cannot update resource OCR: Resource with ID ${id} not found`)
        return null
      }

      // Update the resource OCR data in the database
      const stmt = this.db.prepare(`
        UPDATE resources
        SET ocr_text = ?, ocr_status = ?, ocr_error = ?, updated_time = ?
        WHERE id = ?
      `)

      const result = stmt.run(ocrText, ocrStatus, ocrError, now, id)

      if (result.changes === 0) {
        console.error(`No changes made to resource OCR with ID ${id}`)
        return null
      }

      // Return the updated resource
      return {
        ...existingResource,
        ocr_text: ocrText,
        ocr_status: ocrStatus,
        ocr_error: ocrError,
        updated_time: now
      }
    } catch (error) {
      console.error(`Error updating resource OCR with ID ${id}:`, error)
      return null
    }
  }

  /**
   * Deletes a resource from the database
   * @param id The ID of the resource to delete
   * @returns True if the resource was deleted successfully, false otherwise
   */
  public deleteResource(id: string): boolean {
    try {
      // Check if the resource exists
      const existingResource = this.getResourceById(id)
      if (!existingResource) {
        console.error(`Cannot delete resource: Resource with ID ${id} not found`)
        return false
      }

      // Delete the resource from the database
      const stmt = this.db.prepare('DELETE FROM resources WHERE id = ?')
      const result = stmt.run(id)

      if (result.changes === 0) {
        console.error(`No resource deleted with ID ${id}`)
        return false
      }

      return true
    } catch (error) {
      console.error(`Error deleting resource with ID ${id}:`, error)
      return false
    }
  }
}
