
import { createTreeCollection } from "@ark-ui/solid/tree-view";

/**
 * Enum representing the possible node types in the tree
 */
export enum NodeType {
  NOTE = "note",
  FOLDER = "folder",
  TAG = "tag"
}

/**
 * Node interface for the tree collection
 */
export interface Node {
  id: string;
  name: string;
  type: NodeType;
  children?: Node[];
}

/**
 * Fetch the collection data from the server
 * In the future, this will query from a SQLite database
 * @returns The root node with all children
 */
export async function fetchTreeData(): Promise<Node> {
    "use server";
  // This function runs on the server due to the "use server" directive
  // In the future, replace this with actual database queries
  return {
    id: "ROOT",
    type: NodeType.FOLDER,
    name: "",
    children: [
      {
        id: "node_modules",
        name: "node_modules",
        type: NodeType.FOLDER,
        children: [
          { id: "node_modules/zag-js", name: "zag-js", type: NodeType.NOTE },
          { id: "node_modules/pandacss", name: "panda", type: NodeType.NOTE },
          {
            id: "node_modules/@types",
            name: "@types",
            type: NodeType.FOLDER,
            children: [
              { id: "node_modules/@types/react", name: "react", type: NodeType.FOLDER },
              { id: "node_modules/@types/react-dom", name: "react-dom", type: NodeType.FOLDER },
            ],
          },
        ],
      },
      {
        id: "src",
        name: "src",
        type: NodeType.FOLDER,
        children: [
          { id: "src/app.tsx", name: "app.tsx", type: NodeType.FOLDER },
          { id: "src/index.ts", name: "index.ts", type: NodeType.FOLDER },
        ],
      },
      { id: "panda.config", name: "panda.config.ts", type: NodeType.FOLDER },
      { id: "package.json", name: "package.json", type: NodeType.FOLDER },
      { id: "renovate.json", name: "renovate.json", type: NodeType.FOLDER },
      { id: "readme.md", name: "README.md", type: NodeType.FOLDER },
    ],
  };
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
    type: NodeType.FOLDER,
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
