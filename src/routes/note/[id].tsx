import { useParams } from "@solidjs/router";
import Card from "~/components/Card";
import {
  createResource,
  Show,
  Suspense,
  createSignal,
  createEffect,
} from "solid-js";
import NoteEditor from "~/components/NoteEditor";

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
 * @returns Success message
 */
async function saveNoteBody(id: string, content: string) {
  "use server";
  // This is a placeholder implementation
  // In the future, this would save to a database
  console.log(`Saving note ${id}: ${content}`);
  return { success: true, message: "Note saved successfully" };
}

/**
 * Dynamic ID route component
 * Displays the ID from the URL for debugging purposes
 * @returns Component that shows the ID in a card
 */
export default function DynamicIdPage() {
  const params = useParams();
  const get_note_id = () => params.id;
  const [noteBody, { mutate: mutateNoteBody, refetch: refetchNoteBody }] =
    createResource(get_note_id, getNoteBody);

  // Local editable state that syncs with the resource
  const [editableContent, setEditableContent] = createSignal<string>("");

  // Sync the resource data to our local state when it loads
  createEffect(() => {
    if (noteBody()) {
      setEditableContent(noteBody() || "");
    }
  });

  // Function to save changes
  const saveChanges = async () => {
    const result = await saveNoteBody(get_note_id(), editableContent());
    if (result.success) {
      // Update the resource with our local state to keep them in sync
      mutateNoteBody(editableContent());
    }
  };

  return (
    <main class="p-4">
      <Card title="URL Parameter Debug" variant="bordered" padding="md">
        <p> This is note level URL</p>
        <div class="flex flex-col">
          <p class="text-lg font-medium">ID Parameter:</p>
          <code class="bg-base-200 p-2 rounded mt-2 text-primary font-mono">
            {params.id}
          </code>

          <p class="text-lg font-medium mt-4">Note Body:</p>
          <div class="bg-base-200 p-2 rounded mt-2">
            <Suspense
              fallback={<p class="text-neutral-500">Loading note content...</p>}
            >
              <NoteEditor
                content={editableContent}
                setContent={setEditableContent}
                placeholder=""
              />
              <div class="mt-4">
                <button
                  onClick={saveChanges}
                  class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-focus transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </Suspense>
          </div>
        </div>
      </Card>
      <Card title="Preview" variant="bordered" padding="md">
        <Suspense fallback={<p>Loading Preview</p>}>
          <p>{noteBody()}</p>
        </Suspense>
      </Card>
    </main>
  );
}
