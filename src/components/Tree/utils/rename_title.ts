
import { updateItemTitle } from "~/lib/utils/folders";
import { type NodeMap } from "./insert_item";
import { Accessor, Setter } from "solid-js";

/**
 * Rename a tree item by updating its title in the database and UI
 * @param nodeId The ID of the node to rename
 * @param newTitle The new title for the node
 * @param nodes The current node map
 * @param setNodes The setter function for the node map
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function renameItemTitle(
  nodeId: string,
  newTitle: string,
  nodes: NodeMap,
  setNodes: Setter<NodeMap>
): Promise<boolean> {
  try {
    // Update the title in the database
    const result = await updateItemTitle(nodeId, newTitle);

    if (result.success) {
      // Update the node in the UI
      setNodes((currentNodes) => {
        const updatedNodes = { ...currentNodes };
        const node = updatedNodes[nodeId];

        if (node) {
          updatedNodes[nodeId] = {
            ...node,
            name: newTitle
          };
        }

        return updatedNodes;
      });

      return true;
    } else {
      console.error(`Failed to rename item ${nodeId}: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error(`Error renaming item ${nodeId}:`, error);
    return false;
  }
}

/**
 * Prompt the user to rename an item and update it if they provide a new title
 * @param nodeId The ID of the node to rename
 * @param nodes The current node map
 * @param setNodes The setter function for updating the node map
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function promptAndRenameItem(
  nodeId: string,
  nodes: NodeMap | Accessor<NodeMap>,
  setNodes: Setter<NodeMap>
): Promise<boolean> {
  // Get the node from the map (handle both regular objects and accessors)
  const nodeMap = typeof nodes === 'function' ? nodes() : nodes;
  const currentNode = nodeMap[nodeId];
  
  if (!currentNode) return false;
  
  const currentName = currentNode.name;
  const newTitle = prompt("Enter new title:", currentName);
  
  // Only proceed if a valid, different title was provided
  if (newTitle && newTitle !== currentName) {
    return await renameItemTitle(nodeId, newTitle, nodeMap, setNodes);
  }
  
  return false;
}
