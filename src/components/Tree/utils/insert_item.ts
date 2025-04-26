import { TreeNode } from "@ark-ui/solid";

/**
 * Checks if the given node is a folder by verifying it has children.
 *
 * @param node - The TreeNode to check.
 * @returns true if the node is a folder (has children), false otherwise.
 */
export function isFolder(node: TreeNode): boolean {
  return Boolean(node.children && node.children.length > 0);
}

export function insertItemIntoTree(
  targetNode: TreeNode,
  newNodes: { [x: string]: TreeNode },
  cutNode: TreeNode,
) {
  const targetId = targetNode.id;
  if (isFolder(targetNode)) {
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
