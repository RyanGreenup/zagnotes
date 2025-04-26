import { Accessor, Setter } from "solid-js";
import { isServer } from "solid-js/web";
import { TreeNode, NodeMap } from "./types";

/**
 * Checks if the given node is a folder by verifying it has children.
 *
 * @param node - The TreeNode to check.
 * @returns true if the node is a folder (has children), false otherwise.
 */
export function isFolder(node: TreeNode): boolean {
  return Boolean(node.children && node.children.length > 0);
}

/**
 * Get expanded state from localStorage
 *
 * @returns Record mapping node IDs to their expanded state
 */
export function getStoredExpanded(): Record<string, boolean> {
  if (isServer) return {};
  try {
    const stored = localStorage.getItem("tree-expanded-state");
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Save expanded state to localStorage
 *
 * @param expanded Record mapping node IDs to their expanded state
 */
export function saveExpanded(expanded: Record<string, boolean>): void {
  if (isServer) return;
  try {
    localStorage.setItem("tree-expanded-state", JSON.stringify(expanded));
  } catch (e) {
    console.error("Failed to save tree state");
  }
}

/**
 * Expand all parent nodes of a given node
 * This only expands parent folders, without modifying the target node itself
 * 
 * @param nodeId - ID of the node whose parents should be expanded
 * @param nodes - Current node map accessor
 * @param rootNodeId - ID of the root node to stop at
 * @returns void
 */
export function expandParents(
  nodeId: string, 
  nodes: Accessor<NodeMap>,
  setNodes: Setter<NodeMap>,
  rootNodeId: string
): void {
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
    currentNode.parent !== rootNodeId
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

/**
 * Toggle node expansion - central function for all expansion operations
 *
 * @param id - ID of the node to toggle
 * @param nodes - Current node map
 * @param setNodes - Function to update node state
 * @param focusedId - ID of the currently focused node
 * @param setFocusedId - Function to update the focused node
 */
export function toggleNode(
  id: string,
  nodes: Accessor<NodeMap>,
  setNodes: Setter<NodeMap>,
  focusedId: string,
  setFocusedId: Setter<string>,
): void {
  const nodeMap = nodes();
  const node = nodeMap[id];

  // Only folders can be toggled
  if (!node || !isFolder(node)) return;

  // Remember current focused item
  const currentFocused = focusedId;

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
