import {
  TreeView as ArkTreeView,
  createTreeCollection,
} from "@ark-ui/solid/tree-view";
import { createMemo, For, Show } from "solid-js";
import IconWrapper from "./IconWrapper";
import { ChevronRight, ChevronDown, File, Folder } from "lucide-solid";

/**
 * Interface for tree node items
 */
interface TreeNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: TreeNode[];
}

/**
 * Props for the TreeView component
 */
interface TreeViewProps {
  data: TreeNode[];
}

/**
 * Props for the TreeNodeComponent
 */
interface TreeNodeProps {
  node: TreeNode;
  indexPath: number[];
}

/**
 * Individual tree node component that can be a file or folder
 * Folders can be expanded to show their children
 */
function TreeNodeComponent(props: TreeNodeProps) {
  const { node, indexPath } = props;
  const isFolder = node.type === "folder";
  const hasChildren = isFolder && node.children && node.children.length > 0;

  return (
    <ArkTreeView.NodeProvider node={node} indexPath={indexPath}>
      <Show
        when={hasChildren}
        fallback={
          <ArkTreeView.Item class="select-none flex items-center py-1 px-1 hover:bg-base-300 rounded cursor-pointer transition-colors">
            <span class="w-5"></span>
            <IconWrapper icon={File} size="sm" class="text-neutral" />
            <ArkTreeView.ItemText class="ml-2 text-sm">
              {node.name}
            </ArkTreeView.ItemText>
          </ArkTreeView.Item>
        }
      >
        <ArkTreeView.Branch class="select-none">
          <ArkTreeView.BranchControl class="flex items-center py-1 px-1 hover:bg-base-300 rounded cursor-pointer transition-colors">
            <ArkTreeView.BranchIndicator class="mr-1">
              <IconWrapper icon={ChevronRight} size="sm" class="text-neutral" />
            </ArkTreeView.BranchIndicator>
            <IconWrapper icon={Folder} size="sm" class="text-primary" />
            <ArkTreeView.BranchText class="ml-2 text-sm">
              {node.name}
            </ArkTreeView.BranchText>
          </ArkTreeView.BranchControl>
          <ArkTreeView.BranchContent class="ml-2">
            <For each={node.children}>
              {(child, index) => (
                <TreeNodeComponent
                  node={child}
                  indexPath={[...indexPath, index()]}
                />
              )}
            </For>
          </ArkTreeView.BranchContent>
        </ArkTreeView.Branch>
      </Show>
    </ArkTreeView.NodeProvider>
  );
}

/**
 * TreeView component that displays hierarchical data with keyboard navigation
 * Supports keyboard navigation for accessibility:
 * - Arrow keys to navigate between nodes
 * - Enter/Space to select or expand/collapse nodes
 * - Home/End to jump to first/last node
 * - Type characters to search for nodes
 */
export default function TreeView(props: TreeViewProps) {
  // Create a tree collection from the data
  const collection = createTreeCollection<TreeNode>({
    nodeToValue: (node) => node.id,
    nodeToString: (node) => node.name,
    rootNode: {
      id: "ROOT",
      name: "",
      children: props.data,
    },
  });

  return (
    <ArkTreeView.Root collection={collection}>
      <ArkTreeView.Tree class="w-full">
        <For each={props.data}>
          {(node, index) => (
            <TreeNodeComponent node={node} indexPath={[index()]} />
          )}
        </For>
      </ArkTreeView.Tree>
    </ArkTreeView.Root>
  );
}
