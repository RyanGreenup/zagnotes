import { TreeNode } from "@ark-ui/solid";
import { Setter } from "solid-js";
import type { DbResponse } from "~/lib";

// Type definitions
export type NodeMap = Record<string, TreeNode>;

/**
 * Checks if the given node is a folder by verifying it has children.
 *
 * @param node - The TreeNode to check.
 * @returns true if the node is a folder (has children), false otherwise.
 */
export function hasChildren(node: TreeNode): boolean {
  return Boolean(node.children && node.children.length > 0);
}

/**
 * Common function to update the tree UI when nodes are modified
 *
 * @param nodes - Current node map
 * @param setNodes - Function to update node state
 * @param operation - Function that modifies the node map
 * @param setCutId - Function to update cut ID state (optional)
 * @param cutId - Current cut ID (optional)
 * @param nodeId - Node ID to check for clearing cut state (optional)
 * @returns Updated node map
 */
export function updateTreeNodes(
  nodes: NodeMap,
  setNodes: Setter<NodeMap>,
  operation: (nodes: NodeMap) => NodeMap,
  setCutId?: Setter<string>,
  cutId?: string,
  nodeId?: string,
): NodeMap {
  const currentNodes = nodes;
  const newNodes = operation(currentNodes);

  // Update the tree state
  setNodes(newNodes);

  // Clear cut ID if needed and matches
  if (setCutId && nodeId && cutId === nodeId) {
    setCutId("");
  }

  return newNodes;
}

/**
 * Removes a node from its parent's children array in the node map
 * Used during cut/paste operations to detach a node from its original location
 *
 * @param parent_id - The ID of the parent node containing the node to remove
 * @param newNodes - The working copy of the node map being modified
 * @param nodeId - The ID of the node to remove from its parent
 */
export function removeNodeFromParent(
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
 * Moves a node within the tree and updates the UI
 *
 * @param nodeId - ID of the node to move
 * @param targetId - ID of the target node or location
 * @param nodeMap - Current node map
 * @param setNodes - Function to update node state
 * @param setCutId - Function to update cut ID state
 * @param getCutId - Function to get current cut ID
 * @param props - Tree component props containing rootNode reference
 * @param moveToRoot - If true, moves to root instead of using targetId
 * @param moveItemFunc - Function to move item in the database
 * @param moveItemToRootFunc - Function to move item to root in the database
 * @returns Promise that resolves when the operation is complete
 */
export function moveNodeWithinTree(
  nodeId: string,
  targetId: string,
  nodeMap: NodeMap,
  setNodes: Setter<NodeMap>,
  setCutId: Setter<string>,
  getCutId: () => string,
  rootNodeId: string,
  moveItemFunc: (nodeId: string, targetId: string) => Promise<DbResponse>,
  moveItemToRootFunc: (nodeId: string) => Promise<DbResponse>,
  moveToRoot: boolean = false,
): Promise<boolean> {
  if (
    !nodeId ||
    (!targetId && !moveToRoot) ||
    (nodeId === targetId && !moveToRoot)
  ) {
    return Promise.resolve(false);
  }

  const sourceNode = nodeMap[nodeId];

  if (!sourceNode) {
    return Promise.resolve(false);
  }

  // Make a copy of the current nodes
  const newNodes = { ...nodeMap };

  // Define the server operation to perform
  const serverOperation = moveToRoot
    ? moveItemToRootFunc(nodeId)
    : moveItemFunc(nodeId, targetId);

  // Execute server operation first
  return serverOperation
    .then((result) => {
      if (!result.success) {
        console.error(`Failed to move item: ${result.message}`);
        return false;
      }

      // Update the tree using our common function
      updateTreeNodes(
        nodeMap,
        setNodes,
        (nodeMap) => {
          const newNodes = { ...nodeMap };

          // 1. Remove node from its parent's children
          removeNodeFromParent(sourceNode.parent, newNodes, nodeId);

          // 2. Add node to new location
          if (moveToRoot) {
            // Add to root - we have to get the root node
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
        },
        setCutId,
        getCutId(),
        nodeId,
      );

      return true;
    })
    .catch((error) => {
      console.error("Error moving node:", error);
      return false;
    });
}

export function insertItemIntoTree(
  targetNode: TreeNode,
  newNodes: { [x: string]: TreeNode },
  cutNode: TreeNode,
) {
  const targetId = targetNode.id;
  if (hasChildren(targetNode)) {
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
          (child: TreeNode) => child.id === targetId,
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
