import { getAllNotes } from "../notes/read";
import { getEmbeddings, storeNoteEmbeddings } from "./read";

/**
 * Rebuild the semantic search index for all notes in the database
 *
 * This is likely less efficient or robust than the Rust CLI that was created
 * for this purpose
 *
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
                const all_notes = await getAllNotes();
                for (const note of all_notes) {
                    // Get the embedding
                    let embedding = await getEmbeddings(note.id);
                    // Store the embedding
                    await storeNoteEmbeddings(note.id, embedding);

                }
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

