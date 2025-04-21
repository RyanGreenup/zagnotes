import { useParams, useSearchParams } from "@solidjs/router";
import Card from "~/components/Card";
import {
  createResource,
  Show,
  Suspense,
  createSignal,
  createEffect,
} from "solid-js";
import NoteEditor from "~/components/NoteEditor";
import MyCkEditor from "~/components/MyCkEditor";
import Preview from "~/components/Preview";
import { Tabs } from "@ark-ui/solid";
import { Edit, EyeIcon, Notebook, PackageIcon, Save, Undo } from "lucide-solid";
import Button from "~/components/Button";

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

  const SaveButton = () => {
    return (
      <Button onClick={saveChanges}>
        <Save class="w-4 h-4" />
      </Button>
    );
  };

  const ResetButton = () => {
    return (
      <Button onClick={resetTextBox}>
        <Undo class="w-4 h-4" />
      </Button>
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
    return (
      <Suspense
        fallback={<p class="text-neutral-500">Loading note content...</p>}
      >
        <NoteEditor
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
      <Suspense fallback={<p>Loading Preview</p>}>
        <Card title="Note Preview" variant="bordered" padding="md">
          <Preview content={noteBody} renderOnServer={true} />
        </Card>
      </Suspense>
    );
  };

  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <Show when={searchParams.edit} fallback={<ServerSidePreview />}>
      <main class="p-4">
        <SaveButton />
    <div class="flex flex-col md:flex-row gap-4 h-screen">
      <div class="w-full md:w-1/2 flex-1 overflow-y-auto">
        <SupsenseNoteEditor />
      </div>
      <div class="w-full md:w-1/2 flex-1 overflow-y-auto">
        <LivePreview />
      </div>
    </div>
        {/*
            <NoteDetails />
            */}
      </main>
    </Show>
  );

  return (
    <>
      <Tabs.Root defaultValue="preview">
        <Tabs.List>
          <Tabs.Trigger value={TabValues.Preview} title="Preview">
            <Notebook />
          </Tabs.Trigger>
          <Tabs.Trigger value={TabValues.Edit} title="Edit">
            <Edit />
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value={TabValues.Preview}>
          <ServerSidePreview />
        </Tabs.Content>
        <Tabs.Content value={TabValues.Edit}></Tabs.Content>
      </Tabs.Root>
    </>
  );
}
