"use server";
import type { Note } from './db';
import { getDbConnection } from './db-connection';
import type { SearchResult } from './db-notes';
import * as sqliteVec from "sqlite-vec";
import type { Database } from 'better-sqlite3';

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

    // Ensure the note_embeddings table exists
    try {
      // Check if the table exists by attempting a simple query
      db.prepare("SELECT COUNT(*) FROM note_embeddings LIMIT 1").get();
    } catch (tableError) {
      console.log("Creating note_embeddings virtual table");

      // Create the vector table - adjust dimensions as needed
      // The embedding dimension should match the output size of your model
      // mxbai-embed-large produces 4096-dimensional embeddings
      db.exec("CREATE VIRTUAL TABLE IF NOT EXISTS note_embeddings USING vec0(embedding(4096))");
    }

    try {
      // Convert embeddings to Float32Array for sqlite-vec
      const embeddingVector = new Float32Array(embeddings);

      // Check if the note already has embeddings
      const existingRecord = db.prepare(
        "SELECT note_id FROM note_embeddings WHERE note_id = ?"
      ).get(noteId);

      if (existingRecord) {
        // Update existing embeddings
        db.prepare(
          "UPDATE note_embeddings SET embedding = ? WHERE note_id = ?"
        ).run(embeddingVector, noteId);

        return { success: true, message: `Updated embeddings for note ${noteId}` };
      } else {
        // Insert new embeddings
        db.prepare(
          "INSERT INTO note_embeddings(note_id, embedding) VALUES (?, ?)"
        ).run(noteId, embeddingVector);

        return { success: true, message: `Stored embeddings for note ${noteId}` };
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

/**
 * Generate embeddings for a note and store them in the vector database
 * Useful for re-indexing a single note
 * @param noteId The ID of the note to index
 * @returns Success status object
 */
export async function indexNoteForSemanticSearch(noteId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Get the note from the database
    const { getNote } = await import("./db");
    const note = await getNote(noteId);

    if (!note) {
      return { success: false, message: `Note with ID ${noteId} not found` };
    }

    // Generate embeddings for the note
    const embeddings = await getEmbeddings(note);

    // Store the embeddings
    return await storeNoteEmbeddings(noteId, embeddings);
  } catch (error) {
    console.error(`Error indexing note ${noteId}:`, error);
    return {
      success: false,
      message: `Failed to index note: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Rebuild the semantic search index for all notes in the database
 * @returns Results of the indexing operation
 */
export async function rebuildSemanticSearchIndex(): Promise<{ 
  success: boolean; 
  message: string;
  indexed: number;
  failed: number;
  totalNotes: number;
}> {
  try {
    console.log("Starting semantic search index rebuild");
    
    // Get all notes from the database
    const { getAllNotes } = await import("./db");
    const notes = await getAllNotes();
    
    const totalNotes = notes.length;
    console.log(`Found ${totalNotes} notes to index`);
    
    // Track success and failure counts
    let indexed = 0;
    let failed = 0;
    
    // Process each note
    for (const note of notes) {
      try {
        // Generate and store embeddings
        const embeddings = await getEmbeddings(note);
        await storeNoteEmbeddings(note.id, embeddings);
        indexed++;
        
        // Log progress periodically
        if (indexed % 10 === 0) {
          console.log(`Indexed ${indexed}/${totalNotes} notes`);
        }
      } catch (error) {
        console.error(`Failed to index note ${note.id}:`, error);
        failed++;
      }
    }
    
    const message = `Indexed ${indexed} notes successfully, ${failed} failed, out of ${totalNotes} total notes`;
    console.log(`Completed semantic search index rebuild. ${message}`);
    
    return {
      success: failed === 0,
      message,
      indexed,
      failed,
      totalNotes
    };
  } catch (error) {
    console.error("Error rebuilding semantic search index:", error);
    return {
      success: false,
      message: `Failed to rebuild index: ${error instanceof Error ? error.message : String(error)}`,
      indexed: 0,
      failed: 0,
      totalNotes: 0
    };
  }
}

/**
 * Ensures the sqlite-vec extension is loaded in the database
 * @param db Database connection
 * @returns Boolean indicating if the extension was already loaded or needed to be loaded
 */
async function ensureSqliteVecLoaded(db: Database): Promise<boolean> {
  try {
    // First, check if the extension is already loaded
    const versionResult = db.prepare("SELECT sqlite_vec_version() AS version").get() as { version: string } | undefined;

    if (versionResult) {
      console.log(`sqlite-vec extension already loaded, version: ${versionResult.version}`);
      return true; // Extension was already loaded
    }
  } catch (error) {
    // Extension is not loaded, we'll load it below
    console.log('sqlite-vec extension not yet loaded, attempting to load it now');
  }

  try {
    // Load the extension using the sqliteVec helper
    sqliteVec.load(db);


    // Verify it was loaded successfully
    const versionResult = db.prepare("select vec_version() as vec_version;").get() as { vec_version: string };
    console.log(`Successfully loaded sqlite-vec extension, version: ${versionResult.vec_version}`);

    return false; // Extension needed to be loaded
  } catch (error) {
    console.error('Failed to load sqlite-vec extension:', error);
    throw new Error('Semantic search requires the sqlite-vec extension, but it could not be loaded');
  }
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

    // Check and load sqlite-vec extension if needed
    await ensureSqliteVecLoaded(db);

    // Generate embeddings for the query
    const embeddings = await generateEmbedding(query);

    // Log the first few dimensions of the embedding for debugging
    console.log(`Generated embeddings for query: "${query}" (showing first 5 dimensions)`);
    console.log('Embedding preview:', embeddings.slice(0, 5));

    try {
      // Ensure the note_embeddings virtual table exists
      try {
        // Check if the table exists by attempting a simple query
        db.prepare("SELECT COUNT(*) FROM note_embeddings LIMIT 1").get();
        console.log("note_embeddings table exists");
      } catch (tableError) {
        console.error("note_embeddings table does not exist:", tableError);
        throw new Error("The note_embeddings virtual table is required for semantic search");
      }

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
