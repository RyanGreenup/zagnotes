import {
  createResource,
  Show,
  Suspense,
  createSignal,
  createEffect,
} from "solid-js";
import { RootProvider as GenericTreeView } from "./NoteTree";
import { fetchTreeData, createCollection } from "./treeCollection";
import Card from "./Card";
import SectionHeader from "./SectionHeader";
import Button from "./Button";
import { RefreshCwIcon } from "lucide-solid";
import { useParams } from "@solidjs/router";

/**
 * Component for a refresh button that triggers refetching data
 */
function RefreshButton(props: { onRefresh: () => void }) {
  return (
    <Button variant="secondary" class="mt-4" onClick={props.onRefresh}>
      <RefreshCwIcon />
    </Button>
  );
}

/**
 * Component that fetches tree data from the server and renders a tree view
 * Uses suspense for loading state and provides a refresh button
 */
export default function ServerNoteTree() {
  // Create a resource that fetches tree data from the server
  const [treeData, { refetch }] = createResource(fetchTreeData);

  // Get current note ID from route params
  const params = useParams();

  // State for selected item in tree
  const [selectedItem, setSelectedItem] = createSignal<string[]>([]);

  // Effect to update tree selection when note ID changes
  createEffect(() => {
    if (params.id) {
      setSelectedItem([params.id]);
    } else {
      // Clear selection when not on a note page
      setSelectedItem([]);
    }
  });

  return (
    <>
      {/* <SectionHeader>File Explorer</SectionHeader> */}

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
          <div class="mt-2 mb-4 w-full relative">
            <div>
              {/* Create a collection from the fetched data and pass to RootProvider */}
              <GenericTreeView
                collection={createCollection(treeData()!)}
                selectedValues={selectedItem()}
                horizontalScroll={false}
              />
            </div>
          </div>
        </Show>
      </Suspense>

      {/*<RefreshButton onRefresh={refetch} />*/}
    </>
  );
}
