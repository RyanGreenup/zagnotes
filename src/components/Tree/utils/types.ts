import { Node } from "~/components/treeCollection";

/**
 * Extended TreeNode interface adding UI-specific properties
 */
export interface TreeNode extends Node {
  isExpanded?: boolean;
  depth?: number;
  parent?: string;
}

/**
 * Map of node IDs to TreeNode objects
 */
export type NodeMap = Record<string, TreeNode>;