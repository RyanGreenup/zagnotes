import { useParams } from "@solidjs/router";
import Card from "~/components/Card";
import NoteEditor from "~/components/NoteEditor";
import { createResource, createSignal, Show } from "solid-js";

/**
 * Server function to get note body based on ID
 * @param id The note ID to retrieve
 * @returns A string representing the note body
 */
async function getNoteBody(id: string) {
    "use server";
    // This is a placeholder implementation
    // In the future, this would fetch actual note data from a database
    return `This is the default note body for ID: ${id}`;
}

/**
 * Server function to save note body
 * @param id The note ID to save
 * @param content The content to save
 * @returns A confirmation message
 */
async function saveNoteBody(id: string, content: string) {
    "use server";
    // This is a placeholder implementation
    // In the future, this would save to a database
    console.log(`Saving note ${id} with content: ${content}`);
    return { success: true, message: "Note saved successfully" };
}

/**
 * Dynamic ID route component
 * Displays the ID from the URL and provides a note editor
 * @returns Component that shows the ID and note editor
 */
export default function DynamicIdPage() {
    const params = useParams();
    const [noteBody] = createResource(() => params.id, getNoteBody);
    const [savedStatus, setSavedStatus] = createSignal("");
    
    const handleContentChange = (content: string) => {
        // You could implement auto-save here
        setSavedStatus("Editing...");
    };
    
    const handleSave = async (content: string) => {
        setSavedStatus("Saving...");
        try {
            await saveNoteBody(params.id, content);
            setSavedStatus("Saved!");
            setTimeout(() => setSavedStatus(""), 2000);
        } catch (error) {
            setSavedStatus("Error saving!");
        }
    };

    return (
        <main class="p-4">
            <Card title={`Note: ${params.id}`} variant="bordered" padding="md">
                <div class="flex flex-col">
                    <div class="flex justify-between items-center mb-4">
                        <p class="text-sm text-neutral">ID: {params.id}</p>
                        <span class="text-sm text-neutral">{savedStatus()}</span>
                    </div>
                    
                    <Show
                        when={!noteBody.loading}
                        fallback={<p class="text-neutral-500">Loading note content...</p>}
                    >
                        <div id="editor-container">
                            <NoteEditor 
                                initialContent={noteBody()} 
                                onContentChange={handleContentChange}
                            />
                        </div>
                    </Show>
                </div>
            </Card>
        </main>
    );
}
