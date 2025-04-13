import { createResource, Show, Suspense } from "solid-js";
import { RootProvider } from "./NoteTree";
import { fetchTreeData, createCollection } from "./treeCollection";
import Card from "./Card";
import SectionHeader from "./SectionHeader";
import Button from "./Button";
import { RefreshCwIcon } from "lucide-solid";

/**
 * Component that fetches tree data from the server and renders a tree view
 * Uses suspense for loading state and provides a refresh button
 */
export default function ServerNoteTree() {
  // Create a resource that fetches tree data from the server
  const [treeData, { refetch }] = createResource(fetchTreeData);

  return (
    <Card variant="bordered" padding="md">
      <SectionHeader>File Explorer</SectionHeader>

      {/* Wrap the tree view in Suspense to handle async loading state */}
      <Suspense fallback={<p>Loading file structure...</p>}>
        {/* Show error state if there is one */}
        <Show when={treeData.error}>
          <p style={{ color: "var(--color-error)" }}>
            Error loading files: {treeData.error.message}
          </p>
        </Show>

        {/* Show the tree view when data is available */}
        <Show when={treeData()}>
          <div class="mt-2 mb-4">
            {/* Create a collection from the fetched data and pass to RootProvider */}
            <RootProvider collection={createCollection(treeData()!)} />
          </div>
        </Show>
      </Suspense>

      {/* Button to manually refresh the tree data */}
      <Button variant="secondary" class="mt-4" onClick={() => refetch()}>
        <RefreshCwIcon />
      </Button>
    </Card>
  );
}
