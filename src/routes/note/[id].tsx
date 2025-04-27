import { useParams, useSearchParams } from "@solidjs/router";
import { Save, Undo } from "lucide-solid";
import {
  createEffect,
  createResource,
  createSignal,
  Show,
  Suspense,
} from "solid-js";
import Card from "~/components/Card";
import EditorWithPreview from "~/components/EditorWithPreview";
import ToolbarButton from "~/components/ToolbarButton";

/**
 * Server function to get note body based on ID
 * @param id The note ID to retrieve
 * @returns A string representing the note body
 */
async function getNoteBody(id: string) {
  "use server";

  try {
    const { getNote } = await import("~/lib/db");
    const note = await getNote(id);

    // Return the note body or a default message if not found
    if (note !== null) {
      return note.body;
    } else {
      return `Note with ID ${id} not found`;
    }
  } catch (error) {
    console.error("Error fetching note body:", error);
    return `Error fetching note: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Server function to save note body
 * @param id The note ID to save
 * @param content The content to save
 * @returns Success message
 */
async function saveNoteBody(id: string, content: string) {
  "use server";

  try {
    const { saveNote } = await import("~/lib/db");
    return await saveNote(id, content);
  } catch (error) {
    console.error("Error saving note:", error);
    return {
      success: false,
      message: `Error saving note: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
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

  const resetTextBox = () => {
    const maybe_note_body = noteBody();
    if (maybe_note_body) {
      setEditableContent(maybe_note_body);
    }
  };

  enum TabValues {
    Preview = "preview",
    Edit = "edit",
  }

  /**
   * Toolbar component for note editing actions
   */
  const NoteToolbar = () => {
    return (
      <div class="bg-base-200 px-3 py-2 border-b border-base-300 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <ToolbarButton onClick={resetTextBox}>
            <Undo class="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={saveChanges}>
            <Save class="w-4 h-4" />
          </ToolbarButton>
        </div>
        <div class="text-xs text-base-content/70">Editing: {params.id}</div>
      </div>
    );
  };

  const NoteDetails = () => {
    return (
      <Card title="Editing Region" variant="bordered" padding="md">
        <p> This is note level URL</p>
        <div class="flex flex-col">
          <p class="text-lg font-medium">ID Parameter:</p>
          <code class="bg-base-200 p-2 rounded mt-2 text-primary font-mono">
            {params.id}
          </code>

          <p class="text-lg font-medium mt-4">Note Body:</p>
          <div class="bg-base-200 p-2 rounded mt-2"></div>
        </div>
      </Card>
    );
  };

  const ServerSidePreview = () => {
    return (
      <main class="container mx-auto px-4 py-6 w-full h-full">
        <Suspense fallback={<div class="p-4 animate-pulse">Loading preview...</div>}>
          <div class="markdown-preview prose max-w-none">
            {noteBody()}
          </div>
        </Suspense>
      </main>
    );
  };

  const [searchParams] = useSearchParams();

  return (
    <Show when={searchParams.edit} fallback={<ServerSidePreview />}>
      <main class="w-full h-full">
        <div class="flex flex-col h-full">
          <NoteToolbar />
          <EditorWithPreview 
            content={editableContent}
            setContent={setEditableContent}
          />
        </div>
      </main>
    </Show>
  );
}
