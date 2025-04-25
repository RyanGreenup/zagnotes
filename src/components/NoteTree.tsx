import { useNavigate } from "@solidjs/router";
import { ChevronRight, ScissorsIcon } from "lucide-solid";
import {
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
import type { ContextMenuItem } from "./ContextMenu";
import { ContextMenu } from "./ContextMenu";
import "./NoteTree.css";
import { Node } from "./treeCollection";

// Types
interface TreeNode extends Node {
  isExpanded?: boolean;
  depth?: number;
  parent?: string;
}

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

type NodeMap = Record<string, TreeNode>;

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

// Helper function to check if a node is a folder
export function isFolder(node: TreeNode): boolean {
  return Boolean(node.children && node.children.length > 0);
}

interface MoveItemResult {
  success: boolean;
  message: string;
}

export async function moveItem(
  id: string,
  targetParentId: string,
): Promise<MoveItemResult> {
  "use server";
  try {
    const { moveNote, moveFolder, isFolder, isNote } = await import(
      "~/lib/db-folder"
    );

    // Validate that target is a folder
    if (!(await isFolder(targetParentId))) {
      return {
        success: false,
        message: `Target ${targetParentId} is not a folder`,
      };
    }

    // Move the item based on its type
    if (await isFolder(id)) {
      return await moveFolder(id, targetParentId);
    } else if (await isNote(id)) {
      return await moveNote(id, targetParentId);
    }

    // Fallback case - we don't know what type it is but we'll try folder
    return await moveFolder(id, targetParentId);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Log the error for debugging
    console.error(
      `Error moving item ${id} to ${targetParentId}: ${errorMessage}`,
    );

    return {
      success: false,
      message: `Error moving item ${id} to ${targetParentId}`,
    };
  }
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

  // Context menu items
  const contextMenuItems: ContextMenuItem[] = [
    {
      label: "Open",
      action: (nodeId) => {
        if (isFolder(nodes()[nodeId])) {
          console.log(`Toggle ${nodeId}`);
          toggleNode(nodeId);
        } else {
          console.log(`Navigate ${nodeId}`);
          navigate(`/note/${nodeId}`);
        }
      },
    },
    {
      label: "New Note",
      action: (nodeId) => {
        // Implementation would depend on app's note creation functionality
        console.log(`Create new note in ${nodeId}`);
      },
      isFolder: true,
      separator: true,
    },
    {
      label: "Rename",
      action: (nodeId) => {
        console.log(`Rename ${nodeId}`);
      },
    },
    {
      label: "Delete",
      action: (nodeId) => {
        console.log(`Delete ${nodeId}`);
      },
      separator: true,
    },
    {
      label: "Copy Link",
      action: (nodeId) => {
        const url = `/note/${nodeId}`;
        if (isServer) return;
        navigator.clipboard
          .writeText(window.location.origin + url)
          .then(() => console.log("URL copied to clipboard"))
          .catch((err) => console.error("Failed to copy URL", err));
      },
      isNote: true,
    },
    {
      label: "Cut",
      action: (nodeId) => {
        setCutId(nodeId)
      },
      isNote: true,
    },
    {
      label: "Paste",
      action: (nodeId) => {
          // TODO Need to refactor the handlePasteEvent function to call something else that
          // only depends on nodeId
          // handlePasteEvent(nodeId)
      },
      isNote: true,
    },
  ];

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

  // Get expanded state from localStorage
  function getStoredExpanded(): Record<string, boolean> {
    if (isServer) return {};
    try {
      const stored = localStorage.getItem("tree-expanded-state");
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }

  // Save expanded state to localStorage
  function saveExpanded(expanded: Record<string, boolean>): void {
    if (isServer) return;
    try {
      localStorage.setItem("tree-expanded-state", JSON.stringify(expanded));
    } catch (e) {
      console.error("Failed to save tree state");
    }
  }

  // Helper function to check if a node is a folder
  function isFolder(node: TreeNode): boolean {
    return Boolean(node.children && node.children.length > 0);
  }

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
        setTimeout(() => expandParents(selectedId), 0); // Using setTimeout to ensure nodes state is set
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

  // Expand all parent nodes of a given node
  // This only expands parent folders, without modifying the target node itself
  function expandParents(nodeId: string): void {
    const nodeMap = nodes();
    let currentNode = nodeMap[nodeId];

    // Skip if node doesn't exist
    if (!currentNode) return;

    // Get current expanded state
    const expanded = getStoredExpanded();
    let hasChanges = false;

    // Traverse up the tree and expand all parent nodes
    while (
      currentNode &&
      currentNode.parent &&
      currentNode.parent !== props.collection.rootNode.id
    ) {
      const parentId = currentNode.parent;
      const parentNode = nodeMap[parentId];

      // If parent exists and is not expanded, expand it
      if (parentNode && !parentNode.isExpanded) {
        // Update node in the map
        setNodes({
          ...nodes(),
          [parentId]: { ...parentNode, isExpanded: true },
        });

        // Update expanded state for persistence
        expanded[parentId] = true;
        hasChanges = true;
      }

      // Move up to the next parent
      currentNode = parentNode;
    }

    // Save expanded state if changes were made
    if (hasChanges) {
      saveExpanded(expanded);
    }
  }

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
        expandParents(selectedId);
        setPrevSelectedId(selectedId);
      }
    }
  });

  // Toggle node expansion - central function for all expansion operations
  function toggleNode(id: string): void {
    const nodeMap = nodes();
    const node = nodeMap[id];

    // Only folders can be toggled
    if (!node || !isFolder(node)) return;

    // Remember current focused item
    const currentFocused = focusedId();

    // Toggle expansion state
    const newIsExpanded = !node.isExpanded;

    // Update node state
    setNodes({
      ...nodeMap,
      [id]: { ...node, isExpanded: newIsExpanded },
    });

    // Persist expanded state
    const expanded = getStoredExpanded();
    expanded[id] = newIsExpanded;
    saveExpanded(expanded);

    // Ensure focus is maintained
    setFocusedId(currentFocused);
  }

  // Handle keyboard navigation
  function handleKeyDown(e: KeyboardEvent): void {
    // Only handle keyboard events when the tree is focused
    if (!isTreeFocused()) return;

    const currentId = focusedId();
    if (!currentId) return;

    const nodeMap = nodes();
    const node = nodeMap[currentId];
    const visible = getVisibleNodes();
    const currentIndex = visible.indexOf(currentId);

    /**
     * Removes a node from its parent's children array in the node map
     * Used during cut/paste operations to detach a node from its original location
     *
     * @param parent_id - The ID of the parent node containing the node to remove
     * @param newNodes - The working copy of the node map being modified
     * @param cutId - The ID of the node to remove from its parent
     */
    function removeNodeFromTree(
      parent_id: string | undefined,
      newNodes: { [x: string]: TreeNode },
      cutId: string,
    ) {
      if (parent_id) {
        const parentNode = newNodes[parent_id];
        if (parentNode && parentNode.children) {
          parentNode.children = parentNode.children.filter(
            (child) => child.id !== cutId,
          );
          newNodes[parent_id] = parentNode;
        }
      }
    }

    function focusDown(e: KeyboardEvent): void {
      e.preventDefault();
      if (currentIndex < visible.length - 1) {
        setFocusedId(visible[currentIndex + 1]);
      }
    }

    function handleCutEvent(e: KeyboardEvent): void {
      e.preventDefault();
      setCutId(focusedId());
    }

    function insertItemIntoTree(
      targetNode: TreeNode,
      newNodes: { [x: string]: TreeNode },
      cutNode: TreeNode,
    ) {
      const targetId = targetNode.id;
      if (isFolder(targetNode)) {
        // If target is a folder, add as a child
        if (!targetNode.children) targetNode.children = [];
        targetNode.children.push(cutNode);
        newNodes[targetId] = targetNode;

        // Update parent reference
        cutNode.parent = targetId;
        cutNode.depth = (targetNode.depth || 0) + 1;
      } else {
        // If target is a note, add as sibling
        const parentId = targetNode.parent;
        if (parentId) {
          const parentNode = newNodes[parentId];
          if (parentNode && parentNode.children) {
            // Find index of target node in parent's children
            const targetIndex = parentNode.children.findIndex(
              (child) => child.id === targetId,
            );
            if (targetIndex !== -1) {
              // Insert cut node after target node
              parentNode.children.splice(targetIndex + 1, 0, cutNode);
              newNodes[parentId] = parentNode;

              // Update parent reference
              cutNode.parent = parentId;
              cutNode.depth = targetNode.depth;
            }
          }
        }
      }
    }

    function handlePasteEvent(e: KeyboardEvent): void {
      e.preventDefault();
      const cutId = getCutId();
      const targetId = focusedId();

      if (!cutId || !targetId || cutId === targetId) return;

      const nodeMap = nodes();
      const cutNode = nodeMap[cutId];
      const targetNode = nodeMap[targetId];

      if (!cutNode || !targetNode) return;

      // Make a copy of the current nodes
      const newNodes = { ...nodeMap };

      // Try to move the note first and only proceed if successful
      moveItem(cutId, targetId).then((result) => {
        if (result.success) {
          // 1. Remove cut node from its parent's children
          removeNodeFromTree(cutNode.parent, newNodes, cutId);

          // 2. Add cut node to new location
          insertItemIntoTree(targetNode, newNodes, cutNode);

          // Update the cut node in the map
          newNodes[cutId] = cutNode;

          // Update the tree
          setNodes(newNodes);

          // Clear cut ID
          setCutId("");
        } else {
          console.error(`Failed to move item: ${result.message}`);
        }
      });
    }

    function focusUp(e: KeyboardEvent): void {
      e.preventDefault();
      if (currentIndex > 0) {
        setFocusedId(visible[currentIndex - 1]);
      }
    }

    function expandFocused(e: KeyboardEvent): void {
      e.preventDefault();
      // Expand folder if collapsed
      if (isFolder(node) && !node.isExpanded) {
        toggleNode(currentId);
      }
    }

    function collapseFocused(e: KeyboardEvent): void {
      e.preventDefault();
      if (isFolder(node) && node.isExpanded) {
        // Collapse folder
        toggleNode(currentId);
      } else if (node.parent && node.parent !== props.collection.rootNode.id) {
        // Move focus to parent
        setFocusedId(node.parent);
      }
    }

    function expandSpaceFocused(e: KeyboardEvent): void {
      e.preventDefault();
      if (isFolder(node)) {
        // Allow users to toggle folders freely, even if they contain the current page
        toggleNode(currentId);
      } else {
        // For note nodes, just navigate - URL params will trigger the expansion
        navigate(`/note/${currentId}`);
      }
    }

    function showContextMenuForFocused(e: KeyboardEvent): void {
      e.preventDefault();

      // NOTE the tree sets items to the note-id, I was unable
      // To use `tree-item-${focusedId()}`, the ids did align in the DOM
      // Alternatively, the second (OBOB) element worked, but this would be slower
      // because it's not the first item and walks the DOM.
      // const nodeElement = document.querySelectorAll(`[data-focus="true"][data-part="item"]`)[1];
      const nodeElement = document.getElementById(focusedId());
      if (!nodeElement) return;

      // Get position for the context menu (at mouse position or element center if triggered by keyboard)
      const rect = nodeElement.getBoundingClientRect();

      // Use the center of the element for the context menu position
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      // Show context menu at that position
      setContextMenu({
        show: true,
        x,
        y,
        nodeId: currentId,
        node,
      });
    }

    switch (e.key) {
      case "m":
        showContextMenuForFocused(e);
        break;
      case "x":
        handleCutEvent(e);
        break;
      case "p":
        handlePasteEvent(e);
        break;
      case "ArrowDown":
        focusDown(e);
        break;

      case "j":
        focusDown(e);
        break;

      case "ArrowUp":
        focusUp(e);
        break;

      case "k":
        focusUp(e);
        break;

      case "ArrowRight":
        expandFocused(e);
        break;

      case "l":
        expandFocused(e);
        break;

      case "ArrowLeft":
        collapseFocused(e);
        break;

      case "h":
        collapseFocused(e);
        break;

      case "Enter":
      case " ":
        expandSpaceFocused(e);
        break;
    }
  }

  // Handle node click
  function handleNodeClick(id: string): void {
    const node = nodes()[id];

    // Set focus
    setFocusedId(id);

    // Toggle folder or navigate to note
    if (isFolder(node)) {
      // Allow users to toggle folders freely, even if they contain the current page
      toggleNode(id);
    } else {
      // For note nodes, just navigate - URL params will trigger the expansion
      navigate(`/note/${id}`);
    }
  }

  // Setup focus and keyboard event handlers
  onMount(() => {
    if (!isServer) {
      // Global keyboard event listener
      document.addEventListener("keydown", handleKeyDown);

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
      // Clean up event listeners
      document.removeEventListener("keydown", handleKeyDown);

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

  interface RotatingChevronProps {
    isExpanded: () => boolean;
  }
  function RotatingChevronIcon(props: RotatingChevronProps) {
    return (
      <span
        class="mr-1 inline-flex justify-center items-center w-4 h-4 transition-transform duration-150"
        style={{
          transform: props.isExpanded() ? "rotate(90deg)" : "rotate(0deg)",
        }}
        data-part="branch-indicator"
      >
        <ChevronRight class="w-4 h-4" />
      </span>
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
