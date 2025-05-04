
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
