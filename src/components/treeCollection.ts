
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
 * In the future, this will query from a SQLite database
 * @returns The root node with all children
 */
export async function fetchTreeData(): Promise<Node> {
    "use server";
  // This function runs on the server due to the "use server" directive
  // In the future, replace this with actual database queries
  return {
    id: "ROOT",
    name: "",
    children: [
      {
        id: "node_modules",
        name: "node_modules",
        children: [
          { id: "node_modules/zag-js", name: "zag-js" },
          { id: "node_modules/pandacss", name: "panda" },
          {
            id: "node_modules/@types",
            name: "@types",
            children: [
              { id: "node_modules/@types/react", name: "react" },
              { id: "node_modules/@types/react-dom", name: "react-dom" },
            ],
          },
        ],
      },
      {
        id: "src",
        name: "src",
        children: [
          { id: "src/app.tsx", name: "app.tsx" },
          { id: "src/index.ts", name: "index.ts" },
        ],
      },
      { id: "panda.config", name: "panda.config.ts" },
      { id: "package.json", name: "package.json" },
      { id: "renovate.json", name: "renovate.json" },
      { id: "readme.md", name: "README.md" },
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
