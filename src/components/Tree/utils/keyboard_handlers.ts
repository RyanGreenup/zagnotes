import { TreeNode } from "@ark-ui/solid";
import { Accessor, Setter } from "solid-js";
import { DbResponse } from "~/lib";
import { isFolder, toggleNode } from "./expand_and_collapse_item";
import {
  moveNodeWithinTree,
  pasteCutItemIntoTarget,
  removeNodeFromUI,
} from "./insert_item";
import { NodeMap } from "./types";

/**
 * Function responsible for navigating between routes in the application
 * This should be the output of the `useNavigate` function.
 *
 * @param route - The destination route path to navigate to
 * @returns void
 */
type RouteNavigator = (route: string) => void;

/**
 * Handles keyboard navigation and interaction for the tree component
 */
export function createKeyboardHandlers(
  isTreeFocused: Accessor<boolean>,
  focusedId: Accessor<string>,
  setFocusedId: Setter<string>,
  nodes: Accessor<NodeMap>,
  setNodes: Setter<NodeMap>,
  getCutId: Accessor<string>,
  setCutId: Setter<string>,
  getVisibleNodes: () => string[],
  navigate: RouteNavigator,
  rootNodeId: string,
  moveItem: (sourceId: string, targetId: string) => Promise<DbResponse>,
  moveItemToRoot: (sourceId: string) => Promise<DbResponse>,
  deleteItem: (id: string) => Promise<DbResponse>,
) {
  /**
   * Main keyboard event handler
   */
  function handleKeyDown(e: KeyboardEvent): void {
    // Only handle keyboard events when the tree is focused
    if (!isTreeFocused()) return;

    const currentId = focusedId();
    if (!currentId) return;

    const nodeMap = nodes();
    const node = nodeMap[currentId];
    const visible = getVisibleNodes();
    const currentIndex = visible.indexOf(currentId);

    switch (e.key) {
      case "Delete":
        handleDeleteKeyEvent(e);
        break;
      case "0":
        moveNodeToRoot(e);
        break;
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
      case "j":
        focusDown(e);
        break;
      case "ArrowUp":
      case "k":
        focusUp(e);
        break;
      case "ArrowRight":
      case "l":
        expandFocused(e);
        break;
      case "ArrowLeft":
      case "h":
        collapseFocused(e);
        break;
      case "Enter":
      case " ":
        expandSpaceFocused(e);
        break;
    }
  }

  /**
   * Move focus to the previous node in the visible list
   */
  function focusUp(e: KeyboardEvent): void {
    e.preventDefault();
    const visible = getVisibleNodes();
    const currentIndex = visible.indexOf(focusedId());
    if (currentIndex > 0) {
      setFocusedId(visible[currentIndex - 1]);
    }
  }

  /**
   * Move focus to the next node in the visible list
   */
  function focusDown(e: KeyboardEvent): void {
    e.preventDefault();
    const visible = getVisibleNodes();
    const currentIndex = visible.indexOf(focusedId());
    if (currentIndex < visible.length - 1) {
      setFocusedId(visible[currentIndex + 1]);
    }
  }

  /**
   * Mark the current node as cut (for move operations)
   */
  function handleCutEvent(e: KeyboardEvent): void {
    e.preventDefault();
    setCutId(focusedId());
  }

  /**
   * Paste the previously cut node as a child of the current node
   */
  function handlePasteEvent(e: KeyboardEvent): void {
    e.preventDefault();
    pasteCutItemIntoTarget(
      getCutId(),
      focusedId(),
      nodes(),
      setNodes,
      setCutId,
      getCutId,
      rootNodeId,
      moveItem,
      moveItemToRoot,
    );
  }

  /**
   * Expand the currently focused folder
   */
  function expandFocused(e: KeyboardEvent): void {
    e.preventDefault();
    const currentId = focusedId();
    const node = nodes()[currentId];

    // Expand folder if collapsed
    if (isFolder(node) && !node.isExpanded) {
      toggleNode(currentId, nodes, setNodes, focusedId(), setFocusedId);
    }
  }

  /**
   * Collapse the currently focused folder, or move focus to parent
   */
  function collapseFocused(e: KeyboardEvent): void {
    e.preventDefault();
    const currentId = focusedId();
    const node = nodes()[currentId];

    if (isFolder(node) && node.isExpanded) {
      // Collapse folder
      toggleNode(currentId, nodes, setNodes, focusedId(), setFocusedId);
    } else if (node.parent && node.parent !== rootNodeId) {
      // Move focus to parent
      setFocusedId(node.parent);
    }
  }

  /**
   * Toggle folder expansion or navigate to note
   */
  function expandSpaceFocused(e: KeyboardEvent): void {
    e.preventDefault();
    const currentId = focusedId();
    const node = nodes()[currentId];

    if (isFolder(node)) {
      // Allow users to toggle folders freely, even if they contain the current page
      toggleNode(currentId, nodes, setNodes, focusedId(), setFocusedId);
    } else {
      // For note nodes, just navigate - URL params will trigger the expansion
      navigate(`/note/${currentId}`);
    }
  }

  interface ContextMenuInfo {
    nodeId: string | number; // The ID of the focused node
    node: TreeNode; // The actual node object
    x: number; // X-coordinate for the context menu position
    y: number; // Y-coordinate for the context menu position
  }

  /**
   * Show context menu for currently focused node
   */
  function showContextMenuForFocused(e: KeyboardEvent): ContextMenuInfo | null {
    e.preventDefault();

    // This is a placeholder since the actual context menu handling
    // needs DOM interaction that should remain in the component

    // Implementation needs component context (setContextMenu)
    // Signal to the component to show the context menu

    // The function signature would look like:
    // showContextMenu(focusedId(), nodes()[focusedId()]);

    // This function returns the element ID and position, but the actual
    // context menu display needs to happen in the component
    const nodeElement = document.getElementById(focusedId());
    if (!nodeElement) return null;

    // Get position for the context menu (at the element center)
    const rect = nodeElement.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Return the information needed to show the context menu
    return { nodeId: focusedId(), node: nodes()[focusedId()], x, y };
  }

  /**
   * Delete the currently focused node after confirmation
   */
  function handleDeleteKeyEvent(e: KeyboardEvent): void {
    e.preventDefault();
    const nodeId = focusedId();
    if (!nodeId) return;

    if (confirm(`Are you sure you want to delete this item?`)) {
      removeNodeFromUI(
        nodeId,
        nodes(),
        setNodes,
        setCutId,
        getCutId,
        focusedId(),
        setFocusedId,
        getVisibleNodes,
        deleteItem,
      ).then((success) => {
        if (!success) {
          console.error(`Failed to delete item ${nodeId}`);
        }
      });
    }
  }

  /**
   * Move currently focused node to root level
   */
  function moveNodeToRoot(e: KeyboardEvent): void {
    e.preventDefault();
    moveNodeWithinTree(
      focusedId(),
      "",
      nodes(),
      setNodes,
      setCutId,
      getCutId,
      rootNodeId,
      moveItem,
      moveItemToRoot,
      true,
    ).then((success) => {
      if (!success) {
        console.error(`Failed to move item ${focusedId()} to root`);
      }
    });
  }

  // Return the keyboard event handler and DOM setup functions
  return {
    handleKeyDown,
    setupKeyboardListeners: (treeElement: HTMLDivElement | null) => {
      if (treeElement) {
        // Setup keyboard and focus events
        document.addEventListener("keydown", handleKeyDown);
        return () => {
          // Cleanup
          document.removeEventListener("keydown", handleKeyDown);
        };
      }
      return () => {}; // No-op cleanup if element is null
    },
    showContextMenuForNode: showContextMenuForFocused,
  };
}
