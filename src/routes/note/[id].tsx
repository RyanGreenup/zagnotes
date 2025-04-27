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
import CodeMirrorNoteEditor from "~/components/CodeMirrorNoteEditor";
import Preview from "~/components/Preview";
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

  const SupsenseNoteEditor = () => {
    /*
       NOTE: Below CodeMirrorNoteEditor is used
       This can be Changed to `<NoteEditor` freely in order
       to fall back to a simpler `<textarea` component.
    */
    return (
      <Suspense
        fallback={<p class="text-neutral-500">Loading note content...</p>}
      >
        <CodeMirrorNoteEditor
          content={editableContent}
          setContent={setEditableContent}
          placeholder=""
        />
        {/*
          * This isn't needed, just refresh.
        <ResetButton/>
        */}
      </Suspense>
    );
  };

  const LivePreview = () => {
    return (
      <Suspense fallback={<p>Loading Preview</p>}>
        <Preview content={editableContent} />
      </Suspense>
    );
  };

  const ServerSidePreview = () => {
    return (
      <main class="container mx-auto px-4 py-6 max-w-7xl">
        <Suspense
          fallback={<div class="p-4 animate-pulse">Loading preview...</div>}
        >
          <Preview content={noteBody} renderOnServer={true} />
        </Suspense>
      </main>
    );
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeMobileTab, setActiveMobileTab] = createSignal<"editor" | "preview">("editor");

  return (
    <Show when={searchParams.edit} fallback={<ServerSidePreview />}>
      <main class="container mx-w-full px-2 py-1 max-w-7xl">
        {/* Mobile Tabs - Hidden on tablet/desktop (md and up) */}
        <div class="flex md:hidden gap-2 mb-4 border-b border-base-300">
          <button
            class={`px-4 py-2 font-medium text-sm ${
              activeMobileTab() === "editor"
                ? "text-primary border-b-2 border-primary"
                : "text-base-content/70"
            }`}
            onClick={() => setActiveMobileTab("editor")}
          >
            Editor
          </button>
          <button
            class={`px-4 py-2 font-medium text-sm ${
              activeMobileTab() === "preview"
                ? "text-primary border-b-2 border-primary"
                : "text-base-content/70"
            }`}
            onClick={() => setActiveMobileTab("preview")}
          >
            Preview
          </button>
        </div>

        {/* Tablet/Desktop Split View - Hidden on mobile (below md) */}
        <div class="hidden md:grid grid-cols-2 h-[calc(100vh-8rem)]">
          {/* Editor Panel */}
          <div class="flex flex-col shadow-md overflow-hidden border border-base-300">
            <NoteToolbar />
            <div class="flex-grow bg-base-200 overflow-hidden">
              <Suspense
                fallback={
                  <div class="p-4 animate-pulse">Loading editor...</div>
                }
              >
                <SupsenseNoteEditor />
              </Suspense>
            </div>
          </div>

          {/* Preview Panel */}
          <div class="bg-base-200 shadow-md overflow-hidden border border-base-300">
            <div class="h-full overflow-auto">
              <Suspense
                fallback={
                  <div class="p-4 animate-pulse">Rendering preview...</div>
                }
              >
                <LivePreview />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Mobile Content - Hidden on tablet/desktop (md and up) */}
        <div class="md:hidden">
          <Show when={activeMobileTab() === "editor"}>
            <div class="flex flex-col shadow-md overflow-hidden border border-base-300 h-[calc(100vh-12rem)]">
              <NoteToolbar />
              <div class="flex-grow bg-base-200 overflow-hidden">
                <Suspense
                  fallback={
                    <div class="p-4 animate-pulse">Loading editor...</div>
                  }
                >
                  <SupsenseNoteEditor />
                </Suspense>
              </div>
            </div>
          </Show>

          <Show when={activeMobileTab() === "preview"}>
            <div class="bg-base-200 shadow-md overflow-hidden border border-base-300 h-[calc(100vh-12rem)]">
              <div class="h-full overflow-auto">
                <Suspense
                  fallback={
                    <div class="p-4 animate-pulse">Rendering preview...</div>
                  }
                >
                  <LivePreview />
                </Suspense>
              </div>
            </div>
          </Show>
        </div>
      </main>
    </Show>
  );
}
