import { Setter } from "solid-js";
import type { DbResponse } from "~/lib/db/types/response";
import { TreeNode, NodeMap } from "./types";
import { getStoredExpanded, saveExpanded } from "./expand_and_collapse_item";

export type SetterFunction<T> = (value: T) => void;

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
  // TODO this is a candidate for removal
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

/**
 * Removes a node from the tree UI after it's been deleted from the database
 *
 * @param nodeId - ID of the node to remove
 * @param nodes - Current node map
 * @param setNodes - Function to update node state
 * @param setCutId - Function to update cut ID state
 * @param getCutId - Function to get current cut ID
 * @param focusedId - ID of the currently focused node
 * @param setFocusedId - Function to update the focused node
 * @param getVisibleNodes - Function to get visible nodes
 * @param deleteItemFunc - Function to delete item from the database
 * @returns Promise that resolves when the operation is complete
 */
export function removeNodeFromUI(
  nodeId: string,
  nodes: NodeMap,
  setNodes: Setter<NodeMap>,
  setCutId: Setter<string>,
  getCutId: () => string,
  focusedId: string,
  setFocusedId: Setter<string>,
  getVisibleNodes: () => string[],
  deleteItemFunc: (nodeId: string) => Promise<DbResponse>,
): Promise<boolean> {
  const nodeToDelete = nodes[nodeId];

  if (!nodeToDelete) {
    return Promise.resolve(false);
  }

  // First delete from database
  return deleteItemFunc(nodeId)
    .then((result) => {
      if (!result.success) {
        console.error(`Failed to delete item: ${result.message}`);
        return false;
      }

      // Update the tree using our common function
      const newNodes = updateTreeNodes(
        nodes,
        setNodes,
        (nodeMap) => {
          const newNodes = { ...nodeMap };

          // Remove node from its parent's children
          removeNodeFromParent(nodeToDelete.parent, newNodes, nodeId);

          // Remove the node itself from the map
          delete newNodes[nodeId];

          return newNodes;
        },
        setCutId,
        getCutId(),
        nodeId,
      );

      // If the deleted node was focused, move focus to parent or first available node
      if (focusedId === nodeId) {
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

/**
 * Promotes a node in the tree hierarchy - moving it to its parent's level
 *
 * @param id - ID of the node to promote
 * @param nodes - Current node map
 * @param setNodes - Function to update node state
 * @param setCutId - Function to update cut ID state
 * @param getCutId - Function to get current cut ID
 * @param rootNodeId - ID of the root node
 * @param moveItemFunc - Function to move item in the database
 * @param moveItemToRootFunc - Function to move item to root in the database
 * @param promoteItemFunc - Function to promote item in the database hierarchy
 * @returns Promise that resolves when the operation is complete
 */
export async function promoteTreeItem(
  id: string,
  nodes: NodeMap,
  setNodes: Setter<NodeMap>,
  setCutId: Setter<string>,
  getCutId: () => string,
  rootNodeId: string,
  moveItemFunc: (nodeId: string, targetId: string) => Promise<DbResponse>,
  moveItemToRootFunc: (nodeId: string) => Promise<DbResponse>,
  promoteItemFunc: (id: string) => Promise<DbResponse & { parent_id?: string }>,
): Promise<boolean> {
  // Call the database promotion function
  const promotion_result = await promoteItemFunc(id);
  if (promotion_result.success) {
    console.log("DB Promotion successful");
    const parent_id = promotion_result.parent_id;

    if (parent_id) {
      console.log("Parent ID Identified");
      // Move the node to its new position in the tree
      return moveNodeWithinTree(
        id,
        parent_id,
        nodes,
        setNodes,
        setCutId,
        getCutId,
        rootNodeId,
        moveItemFunc,
        moveItemToRootFunc,
        false,
      );
    } else {
      console.log("No Parent ID Returned");
      return true;
    }
  } else {
    console.error(promotion_result.message);
    return false;
  }
}

/**
 * Creates a new note in the specified folder and updates the tree UI
 * 
 * @param nodeId - ID of the parent folder
 * @param nodes - Current node map
 * @param setNodes - Function to update node state
 * @param setFocusedId - Function to update the focused node
 * @param navigate - Function to navigate to the new note
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function createNewNoteInTree(
  nodeId: string,
  nodes: NodeMap,
  setNodes: Setter<NodeMap>,
  setFocusedId: Setter<string>,
  navigate: (route: string) => void,
): Promise<boolean> {
  try {
    // Import the createNewNote function dynamically to avoid circular dependencies
    const { createNewNote } = await import("~/lib/db/notes/create");
    
    // Create a new note in the selected folder
    const defaultTitle = "New Note";
    const result = await createNewNote(defaultTitle, nodeId);

    if (result.success) {
      // Create a copy of the current nodes
      const nodeMap = nodes;
      const newNodes = { ...nodeMap };

      // Get the parent folder node
      const parentNode = nodeMap[nodeId];

      if (parentNode) {
        // Create a new tree node for the note
        const newNoteNode = {
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
        
        return true;
      } else {
        // Just navigate if we can't update the tree
        navigate(`/note/${result.id}`);
        return true;
      }
    } else {
      console.error(`Failed to create note: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error("Error in createNewNoteInTree:", error);
    return false;
  }
}

/**
 * Creates a new folder in the specified parent folder and updates the tree UI
 * 
 * @param nodeId - ID of the parent folder
 * @param nodes - Current node map
 * @param setNodes - Function to update node state
 * @param setFocusedId - Function to update the focused node
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function createNewFolderInTree(
  nodeId: string,
  nodes: NodeMap,
  setNodes: Setter<NodeMap>,
  setFocusedId: Setter<string>,
): Promise<boolean> {
  try {
    // Import the createFolder function dynamically to avoid circular dependencies
    const { createFolder } = await import("~/lib/db/folders/create");
    
    // Create a new folder in the selected folder
    const defaultTitle = "New Folder";
    const result = await createFolder(defaultTitle, nodeId);

    if (result.success && result.folder) {
      // Create a copy of the current nodes
      const nodeMap = nodes;
      const newNodes = { ...nodeMap };

      // Get the parent folder node
      const parentNode = nodeMap[nodeId];

      if (parentNode) {
        // Make sure parent is expanded
        if (!parentNode.isExpanded) {
          parentNode.isExpanded = true;
          
          // Update expanded state in localStorage
          const expanded = getStoredExpanded();
          expanded[nodeId] = true;
          saveExpanded(expanded);
        }

        // Create a new tree node for the folder
        const newFolderNode = {
          id: result.folder.id,
          name: defaultTitle,
          type: "folder",
          parent: nodeId,
          depth: (parentNode.depth || 0) + 1,
          children: [],
          isExpanded: true  // New folders start expanded
        };

        // Insert the new folder into the tree
        insertItemIntoTree(parentNode, newNodes, newFolderNode);

        // Update the tree
        setNodes(newNodes);

        // Set focus to the new folder
        setFocusedId(result.folder.id);
        
        // Make the new folder expanded by default
        const expanded = getStoredExpanded();
        expanded[result.folder.id] = true;
        saveExpanded(expanded);
        
        return true;
      }
      return false;
    } else {
      console.error(`Failed to create folder: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error("Error in createNewFolderInTree:", error);
    return false;
  }
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

/**
 * Pastes a cut item into the focused target item
 *
 * @param cutId - ID of the item being moved (cut)
 * @param targetId - ID of the target location (focused item)
 * @param nodes - Current node map
 * @param setNodes - Function to update node state
 * @param setCutId - Function to update cut ID state
 * @param getCutId - Function to get current cut ID
 * @param rootNodeId - ID of the root node
 * @param moveItemFunc - Function to move item in the database
 * @param moveItemToRootFunc - Function to move item to root in the database
 * @returns Promise that resolves when the operation is complete
 */
export function pasteCutItemIntoTarget(
  cutId: string,
  targetId: string,
  nodes: NodeMap,
  setNodes: Setter<NodeMap>,
  setCutId: Setter<string>,
  getCutId: () => string,
  rootNodeId: string,
  moveItemFunc: (nodeId: string, targetId: string) => Promise<DbResponse>,
  moveItemToRootFunc: (nodeId: string) => Promise<DbResponse>,
): Promise<boolean> {
  return moveNodeWithinTree(
    cutId,
    targetId,
    nodes,
    setNodes,
    setCutId,
    getCutId,
    rootNodeId,
    moveItemFunc,
    moveItemToRootFunc,
  );
}