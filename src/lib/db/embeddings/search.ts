import { getDbConnection } from "../db-connection";
import { SearchResult } from "../types/response";
import { ensureSqliteVecLoaded } from "./utils/ensure_extension_loaded";

/**
 * Performs semantic search using the given query text and vector similarity
 *
 * This function:
 * 1. Generates embeddings for the search query using the Ollama API
 * 2. Uses sqlite-vec extension to perform vector similarity search
 * 3. Joins with the notes table to return full note information
 *
 * The database must have:
 * - A note_embeddings virtual table created with sqlite-vec extension
 * - The sqlite-vec extension loaded
 * - A notes table with standard fields (id, title, body, etc.)
 *
 * @param query Search query to find semantically similar content
 * @param limit Maximum number of results to return (default: 20)
 * @returns Array of matching notes with similarity scores
 */
export async function semanticSearch(query: string, limit: number = 20): Promise<SearchResult[]> {
  console.log("Beginning Semantic Search");
  try {
    const db = await getDbConnection({ readonly: true });

    // Check and load sqlite-vec extension if needed
    await ensureSqliteVecLoaded(db);

    // Generate embeddings for the query
    const embeddings = await generateEmbedding(query);

    // Log the first few dimensions of the embedding for debugging
    console.log(`Generated embeddings for query: "${query}" (showing first 5 dimensions)`);
    console.log('Embedding preview:', embeddings.slice(0, 5));

    try {
      // Ensure the embedding tables exist
      try {
        // Check if the tables exist by attempting a simple query
        db.prepare("SELECT COUNT(*) FROM ext_embeddings_vec LIMIT 1").get();
        console.log("Embedding tables exist");
      } catch (tableError) {
        console.error("Embedding tables do not exist:", tableError);
        throw new Error("The ext_embeddings_vec virtual table is required for semantic search");
      }

      // Perform vector similarity search using the embeddings
      // Convert embeddings to Float32Array for sqlite-vec
      const embeddingVector = new Float32Array(embeddings);

      // Use the new table structure for vector search
      const results = db.prepare(`
        SELECT
            n.id, n.title, n.body, n.parent_id,
            n.created_time, n.updated_time,
            MIN(v.distance) AS score
        FROM ext_embeddings_vec v
        JOIN ext_embeddings_map m ON v.rowid = m.id
        JOIN ext_note_chunks c ON m.chunk_id = c.id
        JOIN notes n ON c.note_id = n.id
        WHERE v.embedding MATCH ? AND k = ?
        GROUP BY n.id
        ORDER BY score ASC  -- Lower distance means higher similarity
        LIMIT ?
      `).all(embeddingVector, 10, limit) as SearchResult[];

      console.log(`Found ${results.length} semantic search results`);
      return results;
    } catch (err) {
      console.error('Error during vector search:', err);

      // Fallback: Return an empty result set
      return [];
    }
  } catch (error) {
    console.error('Semantic search error:', error);
    return [];
  }
}
