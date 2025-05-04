import { getDbConnection } from "../db-connection";
import { SearchResult } from "../types/response";

/**
 * Search for notes using full-text search
 * @param query Search query string
 * @param limit Maximum number of results to return (default: 20)
 * @returns Array of matching notes with relevance scores
 */
export async function searchNotes(
  query: string,
  limit: number = 20,
): Promise<SearchResult[]> {
  "use server";
  const db = await getDbConnection({ readonly: true });

  try {
    // For FTS5, we use the bm25() function to get relevance scores
    // Using the porter tokenizer for better matching with stemming
    const results = db
      .prepare(
        `
      SELECT notes.id, notes.title, notes.body, notes.parent_id,
             notes.created_time, notes.updated_time,
             bm25(notes_fts5_porter) AS score
      FROM notes_fts5_porter
      JOIN notes ON notes_fts5_porter.id = notes.id
      WHERE notes_fts5_porter MATCH ?
      ORDER BY score
      LIMIT ?
    `,
      )
      .all(query, limit) as SearchResult[];

    return results;
  } catch (error) {
    console.error("Error searching notes:", error);
    return [];
  }
}

