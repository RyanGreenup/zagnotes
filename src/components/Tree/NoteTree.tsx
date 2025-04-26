import { useNavigate } from "@solidjs/router";
import { ChevronRight, ScissorsIcon } from "lucide-solid";
import {
  Accessor,
  createEffect,
  createMemo,
  createSignal,
  For,
  JSX,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { isServer, Portal } from "solid-js/web";
import { ContextMenu } from "~/components/ContextMenu";
import "./NoteTree.css";
import { deleteItem, moveItem, moveItemToRoot } from "~/lib/utils/folders";
import { moveNodeWithinTree } from "./utils/insert_item";
import {
  isFolder,
  toggleNode,
  getStoredExpanded,
  saveExpanded,
  expandParents,
} from "./utils/expand_and_collapse_item";
import { generateContextMenuItems } from "./utils/generate_context_items";
import { createKeyboardHandlers } from "./utils/keyboard_handlers";
import { TreeNode, NodeMap } from "./utils/types";
import RotatingChevronIcon from "./components/Chevron";

// Tree component Props

interface TreeProps {
  collection: {
    rootNode: TreeNode;
    nodeToValue?: (node: TreeNode) => string;
    nodeToString?: (node: TreeNode) => string;
  };
  selectedValues?: string[];
  horizontalScroll?: boolean;
  showVerticalLines?: boolean;
}

// TreeNodeItem component
interface TreeNodeItemProps {
  node: () => TreeNode;
  nodeId: string;
  isSelected: () => boolean;
  horizontalScroll?: boolean;
  horizontalWidthRem: number;
  handleNodeClick: (id: string) => void;
  handleNodeRightClick: (id: string, e: MouseEvent) => void;
  children?: JSX.Element;
}

// Main Tree Component
export function Tree(props: TreeProps) {
  // Core state
  const [nodes, setNodes] = createSignal<NodeMap>({});
  const [focusedId, setFocusedId] = createSignal<string>("");
  const [getCutId, setCutId] = createSignal<string>("");
  const [isTreeFocused, setIsTreeFocused] = createSignal(false);
  const treeRef = { current: null as HTMLDivElement | null };
  const navigate = useNavigate();

  // Context menu state
  const [contextMenu, setContextMenu] = createSignal<{
    show: boolean;
    x: number;
    y: number;
    nodeId: string;
    node: TreeNode;
  }>({
    show: false,
    x: 0,
    y: 0,
    nodeId: "",
    node: {} as TreeNode,
  });

  // Handle right-click on node
  function handleNodeRightClick(id: string, e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();

    const node = nodes()[id];
    if (!node) return;

    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      nodeId: id,
      node,
    });

    // Also set this as the focused node
    setFocusedId(id);
  }

  // Close context menu
  function closeContextMenu(): void {
    setContextMenu((prev) => ({ ...prev, show: false }));
  }

  const getShowVerticalLines = () => {
    return props.showVerticalLines || false;
  };

  // Build the closure for the nodes so the return statement is simpler but we can
  // inherit the props from the container without passing them back in
  const TreeNodeItem = (props: TreeNodeItemProps) => {
    const isCut = createMemo(() => getCutId() === props.nodeId);

    return (
      <div
        id={`${props.nodeId}`}
        classList={{
          "flex items-center px-2 py-1 cursor-pointer": true,
          "bg-[var(--color-base-300)] text-[var(--color-primary)]":
            props.isSelected(),
          "hover:bg-[var(--color-base-200)]": !props.isSelected(),
          "whitespace-nowrap w-max min-w-full": props.horizontalScroll,
          "opacity-80 text-[var(--color-accent)] border-l-2 border-[var(--color-accent)] bg-[var(--color-accent-focus)] bg-opacity-5":
            isCut(),
        }}
        style={{
          "padding-left": `${((props.node().depth || 0) - 1) * props.horizontalWidthRem}rem`,
        }}
        data-part="item"
        data-focus={props.isSelected() ? "true" : undefined}
        data-cut={isCut() ? "true" : undefined}
        onClick={() => props.handleNodeClick(props.nodeId)}
        onContextMenu={(e) => props.handleNodeRightClick(props.nodeId, e)}
      >
        {/*Show vertical lines by default */}
        <Show when={getShowVerticalLines()}>
          {renderVerticalLines(props.node().depth || 0)}
        </Show>
        {/*Add the Chevron Icon */}
        <Show when={isFolder(props.node())}>
          <RotatingChevronIcon
            isExpanded={() => props.node().isExpanded || false}
          />
        </Show>
        {/* Include children if provided */}
        {props.children}

        {/*Show the Node label */}
        <ItemLabel node={props.node} />
      </div>
    );
  };

  // Get node name safely
  function getNodeName(node: TreeNode): string {
    if (props.collection.nodeToString) {
      try {
        return props.collection.nodeToString(node);
      } catch {
        return node.name;
      }
    }
    return node.name;
  }

  // Get visible nodes in display order
  function getVisibleNodes(): string[] {
    const nodeMap = nodes();
    const rootId = props.collection.rootNode.id;
    const result: string[] = [];
    const stack: string[] = [rootId];

    while (stack.length > 0) {
      const id = stack.pop()!;
      const node = nodeMap[id];

      if (!node) continue;

      // Skip root node from visible list
      if (id !== rootId) {
        result.push(id);
      }

      // Add children if expanded
      if (node.isExpanded && node.children) {
        // Add in reverse order for correct display
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push(node.children[i].id);
        }
      }
    }

    return result;
  }

  // Initialize the tree
  createEffect(() => {
    if (!props.collection?.rootNode) return;

    try {
      // Process the tree and create a flat node map
      const expandedState = getStoredExpanded();
      const nodeMap: NodeMap = {};

      function processNode(node: any, depth = 0, parent = ""): void {
        // Ensure node has all necessary properties
        const id = node.id || `node-${Math.random().toString(36).slice(2, 9)}`;
        const processedNode: TreeNode = {
          ...node,
          id,
          name: node.name || id || "Unnamed",
          depth,
          parent,
          // Root node is expanded by default, otherwise check stored state
          isExpanded: id in expandedState ? expandedState[id] : depth === 0,
        };

        // Add to node map
        nodeMap[id] = processedNode;

        // Process children recursively
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child: any) =>
            processNode(child, depth + 1, id),
          );
        }
      }

      // Start processing from root
      processNode(props.collection.rootNode);
      setNodes(nodeMap);

      // Set initial focus
      if (props.selectedValues?.length) {
        const selectedId = props.selectedValues[0];
        setFocusedId(selectedId);
        setPrevSelectedId(selectedId);

        // Expand all parent nodes to reveal the selected node
        // This only happens on initial load or when URL changes
        setTimeout(
          () =>
            expandParents(
              selectedId,
              nodes,
              setNodes,
              props.collection.rootNode.id,
            ),
          0,
        ); // Using setTimeout to ensure nodes state is set
      } else {
        const visible = getVisibleNodes();
        if (visible.length > 0) {
          setFocusedId(visible[0]);
        }
      }
    } catch (error) {
      console.error("Error initializing tree:", error);
    }
  });

  // Track the previous selected ID to detect changes from URL params
  const [prevSelectedId, setPrevSelectedId] = createSignal<string>("");

  // Update focus when selected values change (typically from URL params)
  createEffect(() => {
    if (props.selectedValues?.length) {
      const selectedId = props.selectedValues[0];

      // Set the focused ID
      setFocusedId(selectedId);

      // Only expand parents when the selection changes due to URL params
      // This prevents re-expansion after user manually collapses folders
      if (prevSelectedId() !== selectedId) {
        expandParents(
          selectedId,
          nodes,
          setNodes,
          props.collection.rootNode.id,
        );
        setPrevSelectedId(selectedId);
      }
    }
  });

  // TODO this is a candidate to refactor
  function pasteCutItemIntoFocusedItem(): void {
    const cutId = getCutId();
    const targetId = focusedId();

    moveNodeWithinTree(
      cutId,
      targetId,
      nodes(),
      setNodes,
      setCutId,
      getCutId,
      props.collection.rootNode.id,
      moveItem,
      moveItemToRoot,
    );
  }

  // Set up keyboard handlers
  const keyboardHandlers = createKeyboardHandlers(
    isTreeFocused,
    focusedId,
    setFocusedId,
    nodes,
    setNodes,
    getCutId,
    setCutId,
    getVisibleNodes,
    navigate,
    props.collection.rootNode.id,
    moveItem,
    moveItemToRoot,
    deleteItem,
  );

  // Function to handle showing context menu by keyboard
  function showContextMenuForFocused(e: KeyboardEvent): void {
    e.preventDefault();
    const menuPosition = keyboardHandlers.showContextMenuForNode(e);
    if (!menuPosition) return;

    // Show context menu at that position
    setContextMenu({
      show: true,
      x: menuPosition.x,
      y: menuPosition.y,
      nodeId: String(menuPosition.nodeId),
      node: menuPosition.node,
    });
  }

  // Handle node click
  function handleNodeClick(id: string): void {
    const node = nodes()[id];

    // Set focus
    setFocusedId(id);

    // Toggle folder or navigate to note
    if (isFolder(node)) {
      // Allow users to toggle folders freely, even if they contain the current page
      toggleNode(id, nodes, setNodes, focusedId(), setFocusedId);
    } else {
      // For note nodes, just navigate - URL params will trigger the expansion
      navigate(`/note/${id}`);
    }
  }

  // Track cleanup callback from keyboard handlers
  let cleanupKeyboardHandlers: () => void;

  // Setup focus and keyboard event handlers
  onMount(() => {
    if (!isServer) {
      // Set up keyboard event handlers
      cleanupKeyboardHandlers = keyboardHandlers.setupKeyboardListeners(
        treeRef.current,
      );

      // Set up focus tracking if we have a reference
      if (treeRef.current) {
        // Focus events
        treeRef.current.addEventListener("focusin", () =>
          setIsTreeFocused(true),
        );
        treeRef.current.addEventListener("focusout", () =>
          setIsTreeFocused(false),
        );
      }
    }
  });

  onCleanup(() => {
    if (!isServer) {
      // Clean up keyboard event listeners
      if (cleanupKeyboardHandlers) {
        cleanupKeyboardHandlers();
      }

      // Clean up focus event listeners
      if (treeRef.current) {
        treeRef.current.removeEventListener("focusin", () =>
          setIsTreeFocused(true),
        );
        treeRef.current.removeEventListener("focusout", () =>
          setIsTreeFocused(false),
        );
      }
    }
  });

  /**
   * The indentation width of the tree
   */
  const HORIZONTAL_WIDTH_REM = 1;

  // Render vertical indent lines for tree nodes
  function renderVerticalLines(depth: number) {
    return (
      <For each={Array.from({ length: depth || 0 })}>
        {(_, index) => (
          <div
            class="absolute w-[1px] h-full bg-[var(--color-base-300)] opacity-95 top-0 z-0 pointer-events-none"
            style={{
              left: `${(index() - 1) * HORIZONTAL_WIDTH_REM}rem`,
            }}
          />
        )}
      </For>
    );
  }

  const horizontalScroll = () => props.horizontalScroll || false;

  interface itemLabelProps {
    node: () => TreeNode;
  }

  function ItemLabel(props: itemLabelProps) {
    const isCut = createMemo(() => getCutId() === props.node().id);

    return (
      <span
        classList={{
          "flex items-center gap-2": true,
          "whitespace-nowrap": horizontalScroll(),
          truncate: !horizontalScroll(),
          "text-[var(--color-accent)] font-medium": isCut(),
        }}
        data-part={isFolder(props.node()) ? "branch-text" : "item-text"}
        data-cut={isCut() ? "true" : undefined}
      >
        <span class="truncate flex items-center gap-1">
          <Show when={isCut()}>
            <ScissorsIcon class="h-4 w-4" />
          </Show>
          {getNodeName(props.node())}
        </span>
      </span>
    );
  }

  // Context menu items
  const contextMenuItems = generateContextMenuItems(
    nodes,
    setNodes,
    focusedId,
    setFocusedId,
    setCutId,
    getCutId,
    props.collection.rootNode.id,
    navigate,
    getVisibleNodes,
  );

  // Render tree
  return (
    <>
      <div
        ref={(el) => (treeRef.current = el)}
        classList={{
          "tree-view rounded-md bg-[var(--color-base-100)] text-[var(--color-base-content)]":
            true,
          "w-max min-w-full": props.horizontalScroll,
        }}
        tabIndex={0}
        data-scope="tree-view"
        aria-label="Note Tree"
        onFocus={() => setIsTreeFocused(true)}
        onBlur={() => setIsTreeFocused(false)}
      >
        <ul class="py-1">
          <Show when={props.collection?.rootNode?.children}>
            <For each={getVisibleNodes()}>
              {(nodeId) => {
                const node = () => nodes()[nodeId];
                const isSelected = () => nodeId === focusedId();

                return (
                  <Show when={node()}>
                    <li
                      class="flex flex-col"
                      aria-expanded={node().isExpanded}
                      data-state={node().isExpanded ? "open" : "closed"}
                    >
                      <TreeNodeItem
                        node={node}
                        nodeId={nodeId}
                        isSelected={isSelected}
                        horizontalScroll={props.horizontalScroll}
                        handleNodeClick={handleNodeClick}
                        handleNodeRightClick={handleNodeRightClick}
                        horizontalWidthRem={HORIZONTAL_WIDTH_REM}
                      />
                    </li>
                  </Show>
                );
              }}
            </For>
          </Show>
        </ul>
      </div>

      {/* Context Menu */}
      <Show when={contextMenu().show && !isServer}>
        <Portal>
          <ContextMenu
            items={contextMenuItems}
            x={contextMenu().x}
            y={contextMenu().y}
            nodeId={contextMenu().nodeId}
            node={contextMenu().node}
            onClose={closeContextMenu}
          />
        </Portal>
      </Show>
    </>
  );
}

// Provider for backward compatibility
export function RootProvider(props: TreeProps) {
  return <Tree {...props} />;
}

export default Tree;
