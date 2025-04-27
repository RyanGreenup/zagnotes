"use server";
import type { Note } from './db';

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
  return generateEmbedding(`${note.title}\n${note.content}`);
}

/**
 * Get embeddings for any string using Ollama's mxbai-embed-large model
 * @param text String to embed
 * @returns Array of embedding values
 */
export async function getTextEmbeddings(text: string): Promise<number[]> {
  return generateEmbedding(text);
}
