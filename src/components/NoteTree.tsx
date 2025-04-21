import {
  TreeView,
  TreeViewSelectionChangeDetails,
  useTreeView,
  createTreeCollection,
} from "@ark-ui/solid/tree-view";
import { Node, defaultCollection } from "./treeCollection";
import { useNavigate } from "@solidjs/router";
import { ROUTES } from "../constants/routes";
import {
  CheckSquareIcon,
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
} from "lucide-solid";
import { For, Show, Component } from "solid-js";
import "./NoteTree.css";

/**
 * A tree view component that renders a collection of nodes
 * @param props.collection The tree collection to render
 * I'm trying to keep this generic for both tags and folders
 * However, this may change.
 */
export const RootProvider = (props: {
  collection: ReturnType<typeof createTreeCollection<Node>>;
}) => {
  const navigate = useNavigate();
  const { collection } = props;

  const treeView = useTreeView({
    collection,
    onSelectionChange: (details: TreeViewSelectionChangeDetails) => {
      // Get the selected node ID
      const selectedId = details.selectedValue[0];
      if (selectedId) {
        // Navigate to the note page based on the ID
        // Prepend the note path constant
        navigate(`${ROUTES.NOTE_BASE_PATH}${selectedId}`);
      }
    },
  });

  return (
    <TreeView.RootProvider value={treeView}>
      <TreeView.Tree class="rounded-lg overflow-hidden">
        <For each={collection.rootNode.children}>
          {(node, index) => <TreeNode node={node} indexPath={[index()]} />}
        </For>
      </TreeView.Tree>
    </TreeView.RootProvider>
  );
};

/*
This can be used for a tight heading, I haven't used it though
*/
const TreeLabelComponent: Component<{ label: string }> = ({ label }) => {
  return (
    <TreeView.Label class="text-sm font-semibold uppercase tracking-wider mb-2">
      {label}
    </TreeView.Label>
  );
};

const TreeNode = (props: TreeView.NodeProviderProps<Node>) => {
  const { node, indexPath } = props;
  // Get the focused value
  return (
    <TreeView.NodeProvider node={node} indexPath={indexPath}>
      <Show
        when={node.children}
        fallback={
          <TreeView.Item
            class="py-1.5 px-3 hover:bg-opacity-70 transition-all duration-200 flex items-center gap-2 cursor-pointer"
            data-focus-visible-within:bg-primary-content
            data-focus:bg-primary-content
          >
            <TreeView.ItemIndicator class="text-xs opacity-80">
              <CheckSquareIcon class="h-4 w-4" />
            </TreeView.ItemIndicator>
            <TreeView.ItemText class="flex items-center gap-2 font-medium">
              <FileIcon class="h-4 w-4 opacity-70" />
              <span class="text-sm">{node.name}</span>
            </TreeView.ItemText>
          </TreeView.Item>
        }
      >
        <TreeView.Branch>
          <TreeView.BranchControl
            class="py-1.5 px-3 hover:bg-opacity-80 flex items-center w-full cursor-pointer"
            data-focus-visible-within:bg-primary-content
            data-focus:bg-primary-content
          >
            <TreeView.BranchIndicator class="mr-1">
              <ChevronRightIcon class="h-4 w-4 opacity-70" />
            </TreeView.BranchIndicator>
            <TreeView.BranchText class="flex items-center gap-2 font-medium">
              <FolderIcon class="h-4 w-4" />
              <span class="text-sm">{node.name}</span>
            </TreeView.BranchText>
          </TreeView.BranchControl>
          <TreeView.BranchContent class="pl-4 mt-1">
            <TreeView.BranchIndentGuide class="border-l border-base-300 ml-2 pl-2" />
            <For each={node.children}>
              {(child, index) => (
                <TreeNode node={child} indexPath={[...indexPath, index()]} />
              )}
            </For>
          </TreeView.BranchContent>
        </TreeView.Branch>
      </Show>
    </TreeView.NodeProvider>
  );
};
