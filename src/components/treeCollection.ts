
import { createTreeCollection } from "@ark-ui/solid/tree-view";

/**
 * Node interface for the tree collection
 */
export interface Node {
  id: string;
  name: string;
  children?: Node[];
}

/**
 * Fetch the collection data from the server
 * Fetches from SQLite database using the tree functions
 * @returns The root node with all children
 */
export async function fetchTreeData(): Promise<Node> {
  "use server";
  
  try {
    const { getNoteTree } = await import("~/lib");
    const tree = await getNoteTree();
    
    // Convert TreeNode to Node interface format
    const convertTreeNode = (node: any): Node => {
      const result: Node = {
        id: node.id,
        name: node.name || node.id,
      };
      
      if (node.children && node.children.length > 0) {
        result.children = node.children.map(convertTreeNode);
      }
      
      return result;
    };
    
    return convertTreeNode(tree);
  } catch (error) {
    console.error("Error fetching tree data:", error);
    
    // Return a fallback tree structure on error
    return {
      id: "ROOT",
      name: "Root",
      children: [
        { id: "error", name: "Error loading notes" }
      ]
    };
  }
}

/**
 * Default collection of nodes for the tree view
 * @deprecated Use fetchTreeData() and createCollection() instead
 */
export const defaultCollection = createTreeCollection<Node>({
  nodeToValue: (node) => node.id,
  nodeToString: (node) => node.name,
  rootNode: {
    id: "ROOT",
    name: "",
    children: [], // Empty by default, should be populated from fetchTreeData
  },
});

/**
 * Create a tree collection from a list of nodes
 * @param rootNode The root node to create a collection from
 * @returns A tree collection
 */
export const createCollection = (rootNode: Node) => {
  return createTreeCollection<Node>({
    nodeToValue: (node) => node.id,
    nodeToString: (node) => node.name,
    rootNode,
  });
};
