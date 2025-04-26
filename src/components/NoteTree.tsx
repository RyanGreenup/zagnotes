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
import {
  deleteItem,
  moveItem,
  promoteItem,
  promoteNote,
} from "~/lib/utils/folders";
import type { DbResponse } from "~/lib";
import { createNewNote, getNoteParent } from "~/lib/db-notes";
import { moveItemToRoot } from "~/lib/utils/folders";
import { insertItemIntoTree, isFolder } from "./Tree/utils/insert_item";

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
      action: async (nodeId) => {
        // Create a new note in the selected folder
        const defaultTitle = "New Note";
        const result = await createNewNote(defaultTitle, nodeId);

        if (result.success) {
          // Create a copy of the current nodes
          const nodeMap = nodes();
          const newNodes = { ...nodeMap };

          // Get the parent folder node
          const parentNode = nodeMap[nodeId];

          if (parentNode) {
            // Create a new tree node for the note
            const newNoteNode: TreeNode = {
              id: result.id,
              name: defaultTitle,
              type: "file",
              parent: nodeId,
              depth: (parentNode.depth || 0) + 1,
            };

            // Insert the new note into the tree
            insertItemIntoTree(parentNode, newNodes, newNoteNode);

            // Update the tree
            setNodes(newNodes);

            // Set focus to the new note
            setFocusedId(result.id);

            // Navigate to the new note
            navigate(`/note/${result.id}`);
          } else {
            // Just navigate if we can't update the tree
            navigate(`/note/${result.id}`);
          }
        } else {
          console.error(`Failed to create note: ${result.message}`);
        }
      },
      separator: true,
    },
    {
      label: "Promote",
      action: (nodeId) => {
        console.log("Staring promotion");
        promoteTreeItem(nodeId);
        console.log("Promotion complete");
      },
    },
    {
      label: "Cut",
      action: (nodeId) => {
        setCutId(nodeId);
      },
    },
    {
      label: "Paste",
      action: (nodeId) => {
        // TODO Need to refactor the handlePasteEvent function to call something else that
        // only depends on nodeId
        pasteCutItemIntoFocusedItem();
      },
    },
    {
      label: "Rename",
      action: (nodeId) => {
        console.log(`Rename ${nodeId}`);
      },
    },
    {
      label: "Move to Root",
      action: (nodeId) => {
        moveNodeWithinTree(nodeId, "", true).then((success) => {
          if (!success) {
            console.error(`Failed to move item ${nodeId} to root`);
          }
        });
      },
    },
    {
      label: "Delete",
      action: (nodeId) => {
        if (confirm(`Are you sure you want to delete this item?`)) {
          removeNodeFromUI(nodeId).then((success) => {
            if (!success) {
              console.error(`Failed to delete item ${nodeId}`);
            }
          });
        }
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

  /**
   * Removes a node from its parent's children array in the node map
   * Used during cut/paste operations to detach a node from its original location
   *
   * @param parent_id - The ID of the parent node containing the node to remove
   * @param newNodes - The working copy of the node map being modified
   * @param nodeId - The ID of the node to remove from its parent
   */
  function removeNodeFromParent(
    parent_id: string | undefined,
    newNodes: { [x: string]: TreeNode },
    nodeId: string,
  ) {
    if (parent_id) {
      const parentNode = newNodes[parent_id];
      if (parentNode && parentNode.children) {
        parentNode.children = parentNode.children.filter(
          (child) => child.id !== nodeId,
        );
        newNodes[parent_id] = parentNode;
      }
    }
  }

  /**
   * Common function to update the tree UI when nodes are modified
   * @param operation Function that modifies the node map
   * @param nodeId Node ID to check for clearing cut state
   * @returns Updated node map
   */
  function updateTreeNodes(
    operation: (nodes: NodeMap) => NodeMap,
    nodeId?: string,
  ): NodeMap {
    const currentNodes = nodes();
    const newNodes = operation(currentNodes);

    // Update the tree state
    setNodes(newNodes);

    // Clear cut ID if needed and matches
    if (nodeId && getCutId() === nodeId) {
      setCutId("");
    }

    return newNodes;
  }

  /**
   * Moves a node within the tree and updates the UI
   * @param nodeId - ID of the node to move
   * @param targetId - ID of the target node or location
   * @param moveToRoot - If true, moves to root instead of using targetId
   * @returns Promise that resolves when the operation is complete
   */
  function moveNodeWithinTree(
    nodeId: string,
    targetId: string,
    moveToRoot: boolean = false,
  ): Promise<boolean> {
    if (
      !nodeId ||
      (!targetId && !moveToRoot) ||
      (nodeId === targetId && !moveToRoot)
    ) {
      return Promise.resolve(false);
    }

    const nodeMap = nodes();
    const sourceNode = nodeMap[nodeId];

    if (!sourceNode) {
      return Promise.resolve(false);
    }

    // Make a copy of the current nodes
    const newNodes = { ...nodeMap };

    // Define the server operation to perform
    const serverOperation = moveToRoot
      ? moveItemToRoot(nodeId)
      : moveItem(nodeId, targetId);

    // Execute server operation first
    return serverOperation
      .then((result) => {
        if (!result.success) {
          console.error(`Failed to move item: ${result.message}`);
          return false;
        }

        // Update the tree using our common function
        updateTreeNodes((nodeMap) => {
          const newNodes = { ...nodeMap };

          // 1. Remove node from its parent's children
          removeNodeFromParent(sourceNode.parent, newNodes, nodeId);

          // 2. Add node to new location
          if (moveToRoot) {
            // Add to root - we have to get the root node
            const rootNodeId = props.collection.rootNode.id;
            const rootNode = nodeMap[rootNodeId];

            if (rootNode) {
              // Update parent reference
              sourceNode.parent = rootNodeId;
              sourceNode.depth = 1; // Root level

              // Add to root children
              if (!rootNode.children) rootNode.children = [];
              rootNode.children.push(sourceNode);
              newNodes[rootNodeId] = rootNode;
            }
          } else {
            // Add to target
            const targetNode = nodeMap[targetId];
            if (targetNode) {
              insertItemIntoTree(targetNode, newNodes, sourceNode);
            }
          }

          // Update the node in the map
          newNodes[nodeId] = sourceNode;

          return newNodes;
        }, nodeId);

        return true;
      })
      .catch((error) => {
        console.error("Error moving node:", error);
        return false;
      });
  }

  /**
   * Removes a node from the tree UI after it's been deleted from the database
   * @param nodeId - ID of the node to remove
   * @returns Promise that resolves when the operation is complete
   */
  function removeNodeFromUI(nodeId: string): Promise<boolean> {
    const nodeMap = nodes();
    const nodeToDelete = nodeMap[nodeId];

    if (!nodeToDelete) {
      return Promise.resolve(false);
    }

    // First delete from database
    return deleteItem(nodeId)
      .then((result) => {
        if (!result.success) {
          console.error(`Failed to delete item: ${result.message}`);
          return false;
        }

        // Update the tree using our common function
        const newNodes = updateTreeNodes((nodeMap) => {
          const newNodes = { ...nodeMap };

          // Remove node from its parent's children
          removeNodeFromParent(nodeToDelete.parent, newNodes, nodeId);

          // Remove the node itself from the map
          delete newNodes[nodeId];

          return newNodes;
        }, nodeId);

        // If the deleted node was focused, move focus to parent or first available node
        if (focusedId() === nodeId) {
          if (nodeToDelete.parent && newNodes[nodeToDelete.parent]) {
            setFocusedId(nodeToDelete.parent);
          } else {
            const visibleNodes = getVisibleNodes();
            if (visibleNodes.length > 0) {
              setFocusedId(visibleNodes[0]);
            }
          }
        }

        // Clear cut ID if it matches
        if (getCutId() === nodeId) {
          setCutId("");
        }

        return true;
      })
      .catch((error) => {
        console.error("Error deleting node:", error);
        return false;
      });
  }

  function pasteCutItemIntoFocusedItem(): void {
    const cutId = getCutId();
    const targetId = focusedId();

    moveNodeWithinTree(cutId, targetId);
  }

  async function promoteTreeItem(id: string) {
    const promotion_result = await promoteItem(id);
    if (promotion_result.success) {
      console.log("DB Promotion successfull");
      const parent_id = promotion_result.parent_id;
      if (parent_id) {
        console.log("Parent ID Itentified");
        moveNodeWithinTree(id, parent_id, false);
      } else {
        console.log("No Parent ID Returned");
      }
    } else {
      console.error(promotion_result.message);
    }
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

    function focusUp(e: KeyboardEvent): void {
      e.preventDefault();
      if (currentIndex > 0) {
        setFocusedId(visible[currentIndex - 1]);
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

    function handlePasteEvent(e: KeyboardEvent): void {
      e.preventDefault();
      pasteCutItemIntoFocusedItem();
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

    function handleDeleteKeyEvent(e: KeyboardEvent): void {
      e.preventDefault();
      const nodeId = focusedId();
      if (!nodeId) return;

      if (confirm(`Are you sure you want to delete this item?`)) {
        removeNodeFromUI(nodeId).then((success) => {
          if (!success) {
            console.error(`Failed to delete item ${nodeId}`);
          }
        });
      }
    }

    switch (e.key) {
      case "Delete":
        handleDeleteKeyEvent(e);
        break;
      case "0":
        moveNodeWithinTree(focusedId(), "", true).then((success) => {
          if (!success) {
            console.error(`Failed to move item ${focusedId()} to root`);
          }
        });
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
