import { createResource, Show, Suspense, Index } from "solid-js";
import { RootProvider as OriginalGenericTreeView } from "./NoteTree";
import { Node, fetchTreeData, createCollection } from "./treeCollection";
import Card from "./Card";
import SectionHeader from "./SectionHeader";
import Button from "./Button";
import { RefreshCwIcon } from "lucide-solid";
import { JSX } from "solid-js/h/jsx-runtime";

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
          {/*This was our first attempt at a tree widget / component*/}
            {/* Create a collection from the fetched data and pass to RootProvider */}
            <OriginalGenericTreeView collection={createCollection(treeData()!)} />
          {/*Here we have written another tree component*/}
            <GenericTreeView collection={createCollection(treeData()!)} />
            {/* Display the tree data as JSON for debugging */}
            <DisplayTreeData treedata={treeData()}/>
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


// Define the interface for DisplayTreeData props
interface DisplayTreeDataProps {
    treedata: Node | undefined; // Using 'any' for now, but ideally this would be the Node type from treeCollection
}

function DisplayTreeData(props: DisplayTreeDataProps) {
    return (
        <>
            <pre class="mt-4 p-2 bg-base-200 rounded text-sm overflow-auto max-h-60">
              <Show when={props.treedata} fallback={<p> No Data </p>}>
              {JSON.stringify(props.treedata, null, 2)}
              </Show>

            </pre>
        </>
    );
}


interface GenericTreeViewProps {
    treedata: Node;
}

function GenericTreeView(props: GenericTreeViewProps) {
    return (
        <>
        <Index each={props.treedata != undefined}>
        {(item, index) => (
            item
        )}
        </Index>
        </>
    );
}
