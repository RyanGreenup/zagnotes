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
  ref?: (el: HTMLElement) => void;
}

/**
 * Props for the TreeNodeComponent
 */
interface TreeNodeProps {
  node: TreeNode;
  indexPath: number[];
  ref?: (el: HTMLElement) => void;
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
          <ArkTreeView.Item
            class="select-none flex items-center py-1 px-1 hover:bg-base-300 rounded cursor-pointer transition-colors"
            ref={props.ref}
            tabIndex={0}
          >
            <span class="w-5"></span>
            <IconWrapper icon={File} size="sm" class="text-neutral" />
            <ArkTreeView.ItemText class="ml-2 text-sm">
              {node.name}
            </ArkTreeView.ItemText>
          </ArkTreeView.Item>
        }
      >
        <ArkTreeView.Branch class="select-none">
          <ArkTreeView.BranchControl
            class="flex items-center py-1 px-1 hover:bg-base-300 rounded cursor-pointer transition-colors"
            ref={props.ref}
            tabIndex={0}
          >
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

  // Create a reference to the first tree item for focusing
  let firstItemRef: HTMLElement | undefined;

  // Function to focus the first item in the tree
  const focusFirstItem = () => {
    if (firstItemRef) {
      firstItemRef.focus();
    }
  };

  // Expose the focus method through the ref
  const handleRef = (el: HTMLElement) => {
    if (props.ref) {
      // Extend the element with a custom focus method
      const originalFocus = el.focus;
      el.focus = () => {
        originalFocus.call(el);
        // Focus the first item after focusing the tree
        setTimeout(focusFirstItem, 0);
      };
      props.ref(el);
    }
  };

  return (
    <ArkTreeView.Root collection={collection} lazyMount={true}>
      <ArkTreeView.Tree
        class="w-full"
        ref={handleRef}
        tabIndex={0} // Make it focusable
      >
        <For each={props.data}>
          {(node, index) =>
            index() === 0 ? (
              <TreeNodeComponent
                node={node}
                indexPath={[index()]}
                ref={(el) => (firstItemRef = el)}
              />
            ) : (
              <TreeNodeComponent node={node} indexPath={[index()]} />
            )
          }
        </For>
      </ArkTreeView.Tree>
    </ArkTreeView.Root>
  );
}
