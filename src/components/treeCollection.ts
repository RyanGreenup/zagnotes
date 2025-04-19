
import { createTreeCollection } from "@ark-ui/solid/tree-view";

/**
 * Node interface for the tree collection
 */
export interface Node {
  id: string;
  name: string;
  type: string,
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
    type: "folder",
    name: "",
    children: [
      {
        id: "node_modules",
        name: "node_modules",
        type: "folder",
        children: [
          { id: "node_modules/zag-js", name: "zag-js", type: "note" },
          { id: "node_modules/pandacss", name: "panda", type: "note" },
          {
            id: "node_modules/@types",
            name: "@types",
            type: "folder"
            children: [
              { id: "node_modules/@types/react", name: "react", type: "folder" },
              { id: "node_modules/@types/react-dom", name: "react-dom", type: "folder" },
            ],
          },
        ],
      },
      {
        id: "src",
        name: "src",
        children: [
          { id: "src/app.tsx", name: "app.tsx", type: "folder" },
          { id: "src/index.ts", name: "index.ts", type: "folder" },
        ],
      },
      { id: "panda.config", name: "panda.config.ts", type: "folder" },
      { id: "package.json", name: "package.json", type: "folder" },
      { id: "renovate.json", name: "renovate.json", type: "folder" },
      { id: "readme.md", name: "README.md", type: "folder" },
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
