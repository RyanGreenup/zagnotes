"use server";
import type { Note } from './db';
import { getDbConnection } from './db-connection';
import type { SearchResult } from './db-notes';
import * as sqliteVec from "sqlite-vec";

const OLLAMA_SCHEME = process.env.OLLAMA_SCHEME || 'http';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'localhost';
const OLLAMA_PORT = process.env.OLLAMA_PORT || '11434';
const OLLAMA_URL = `${OLLAMA_SCHEME}://${OLLAMA_HOST}:${OLLAMA_PORT}`;
const EMBED_MODEL = 'mxbai-embed-large';

/**
 * Core function to generate embeddings for any text using Ollama's model
 * @param text Text to embed
 * @returns Array of embedding values
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBED_MODEL,
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

/**
 * Get embeddings for a note using Ollama's mxbai-embed-large model
 * @param note Note to embed
 * @returns Array of embedding values
 */
export async function getEmbeddings(note: Note): Promise<number[]> {
  // Combine title and body for better semantic representation
  const textToEmbed = `${note.title}\n${note.body}`;
  return generateEmbedding(textToEmbed);
}

/**
 * Get embeddings for any string using Ollama's mxbai-embed-large model
 * @param text String to embed
 * @returns Array of embedding values
 */
export async function getTextEmbeddings(text: string): Promise<number[]> {
  return generateEmbedding(text);
}

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

    // Check if sqlite-vec is loaded
    try {
      const version = db.prepare("SELECT sqlite_vec_version()").get();
      console.log('Using sqlite-vec version:', version);
    } catch (error) {
      console.error('sqlite-vec extension not loaded');
      throw new Error('Semantic search requires the sqlite-vec extension');
    }

    // Generate embeddings for the query
    const embeddings = await generateEmbedding(query);

    // Log the first few dimensions of the embedding for debugging
    console.log(`Generated embeddings for query: "${query}" (showing first 5 dimensions)`);
    console.log('Embedding preview:', embeddings.slice(0, 5));

    try {
      // Perform vector similarity search using the embeddings
      // Convert embeddings to Float32Array for sqlite-vec
      const embeddingVector = new Float32Array(embeddings);

      // The note_embeddings table is expected to have columns: note_id, embedding
      const results = db.prepare(`
        SELECT notes.id, notes.title, notes.body, notes.parent_id,
               notes.created_time, notes.updated_time,
               distance AS score
        FROM note_embeddings
        JOIN notes ON note_embeddings.note_id = notes.id
        WHERE embedding MATCH ?
        ORDER BY score ASC  -- Lower distance means higher similarity
        LIMIT ?
      `).all(embeddingVector, limit) as SearchResult[];

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
