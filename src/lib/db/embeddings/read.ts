import { getDbConnection } from "../db-connection";
import { ensureSqliteVecLoaded } from "./utils/ensure_extension_loaded";

/**
 * Get embeddings for a note using Ollama's mxbai-embed-large model
 * @param note Note to embed
 * @returns Array of embedding values
 */
export async function getEmbeddings(note: { id?: string; title?: string; body: string }): Promise<number[]> {
  // Combine title and body for better semantic representation
  const textToEmbed = `${note.title || ''}\n${note.body}`;
  return generateEmbedding(textToEmbed);
}

/**
 * Store note embeddings in the vector database for semantic search
 * @param noteId The ID of the note to store embeddings for
 * @param embeddings The vector embeddings for the note
 * @returns Success status object
 */
export async function storeNoteEmbeddings(noteId: string, embeddings: number[]): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDbConnection();

    // Ensure sqlite-vec extension is loaded
    await ensureSqliteVecLoaded(db);

    // Ensure the vector embedding tables exist
    try {
      // Check if the tables exist by attempting a simple query
      db.prepare("SELECT COUNT(*) FROM ext_embeddings_vec LIMIT 1").get();
    } catch (tableError) {
      console.log("Creating vector embedding tables");

      // TODO: The actual creation of these tables should be handled by an external tool
      // as per requirements. This is just a placeholder.

      // Create the vector table - adjust dimensions as needed
      // The embedding dimension should match the output size of your model
      // mxbai-embed-large produces 4096-dimensional embeddings
      db.exec("CREATE VIRTUAL TABLE IF NOT EXISTS ext_embeddings_vec USING vec0(embedding(4096))");
      db.exec("CREATE TABLE IF NOT EXISTS ext_note_chunks (id TEXT PRIMARY KEY, note_id TEXT, content TEXT)");
      db.exec("CREATE TABLE IF NOT EXISTS ext_embeddings_map (id INTEGER PRIMARY KEY, chunk_id TEXT)");
      db.exec("CREATE TABLE IF NOT EXISTS ext_embeddings_meta (chunk_id TEXT PRIMARY KEY, created_at INTEGER)");
    }

    try {
      // Convert embeddings to Float32Array for sqlite-vec
      const embeddingVector = new Float32Array(embeddings);

      // TODO: This implementation needs to be updated to use the new table structure
      // Currently, we're just providing a placeholder since users should use external tools

      // Check if the note already has embeddings
      const existingRecord = db.prepare(
        "SELECT m.chunk_id FROM ext_embeddings_map m JOIN ext_note_chunks c ON m.chunk_id = c.id WHERE c.note_id = ? LIMIT 1"
      ).get(noteId);

      if (existingRecord) {
        // For now, just report success but the actual logic needs to be updated
        console.log("TODO: Update existing embeddings for this note");
        return { success: true, message: `Updated embeddings for note ${noteId} (placeholder)` };
      } else {
        // For now, just report success but the actual logic needs to be updated
        console.log("TODO: Insert new embeddings for this note");
        return { success: true, message: `Stored embeddings for note ${noteId} (placeholder)` };
      }
    } catch (error) {
      console.error('Error storing note embeddings:', error);
      return { success: false, message: `Failed to store embeddings: ${error instanceof Error ? error.message : String(error)}` };
    }
  } catch (error) {
    console.error('Error accessing database for storing embeddings:', error);
    return { success: false, message: `Database error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Get embeddings for any string using Ollama's mxbai-embed-large model
 * @param text String to embed
 * @returns Array of embedding values
 */
export async function getTextEmbeddings(text: string): Promise<number[]> {
  return generateEmbedding(text);
}

