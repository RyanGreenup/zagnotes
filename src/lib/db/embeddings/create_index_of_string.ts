import { getEmbeddings, storeNoteEmbeddings } from "./read";

/**
 * Generate embeddings for a note and store them in the vector database
 * Useful for re-indexing a single note
 * @param noteId The ID of the note to index
 * @returns Success status object
 */
export async function indexNoteForSemanticSearch(noteId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Get the note from the database
    const { getNote } = await import("../db");
    const note = await getNote(noteId);

    if (!note) {
      return { success: false, message: `Note with ID ${noteId} not found` };
    }

    // Add the ID to the note object for completeness
    const noteWithId = { ...note, id: noteId };

    // Generate embeddings for the note
    const embeddings = await getEmbeddings(noteWithId);

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
