import { ContextMenuItem } from "~/components/ContextMenu";
import {
  insertItemIntoTree,
  moveNodeWithinTree,
  NodeMap,
  promoteTreeItem,
  removeNodeFromUI,
} from "../utils/insert_item";
import {
  getVisibleNodes,
  isFolder,
  toggleNode,
} from "../utils/expand_and_collapse_item";
import { createNewNote } from "~/lib/db-notes";
import { TreeNode } from "@ark-ui/solid";
import { Accessor, Setter } from "solid-js";
import {
  deleteItem,
  moveItem,
  moveItemToRoot,
  promoteItem,
} from "~/lib/utils/folders";
import { isServer } from "solid-js/web";

function pasteCutItemIntoFocusedItem(
  nodes: Accessor<NodeMap>,
  focusedId: Accessor<string>,
  getCutId: Accessor<string>,
  setCutId: Setter<string>,
  setNodes: Setter<NodeMap>,
  rootNodeId: string,
): void {
  const cutId = getCutId();
  const targetId = focusedId();

  moveNodeWithinTree(
    cutId,
    targetId,
    nodes,
    setNodes,
    setCutId,
    getCutId,
    rootNodeId,
    moveItem,
    moveItemToRoot,
  );
}

export function generate_context_menu(
  nodes: Accessor<NodeMap>,
  navigate: (route: string) => void,
  setNodes: Setter<NodeMap>,
  focusedId: Accessor<string>,
  setFocusedId: Setter<string>,
  setCutId: Setter<string>,
  getCutId: Accessor<string>,
  rootNodeId: string,
): ContextMenuItem {
  // Context menu items
  const contextMenuItems: ContextMenuItem[] = [
    {
      label: "Open",
      action: (nodeId: string) => {
        if (isFolder(nodes()[nodeId])) {
          console.log(`Toggle ${nodeId}`);
          toggleNode(nodeId, nodes, setNodes, focusedId, setFocusedId);
        } else {
          console.log(`Navigate ${nodeId}`);
          navigate(`/note/${nodeId}`);
        }
      },
    },
    {
      label: "New Note",
      action: async (nodeId) => {
        // Create a new note in the selected folder
        const defaultTitle = "New Note";
        const result = await createNewNote(defaultTitle, nodeId);
        const nodeMap = nodes();

        if (result.success) {
          // Create a copy of the current nodes
          const newNodes = { ...nodeMap };

          // Get the parent folder node
          const parentNode = nodeMap[nodeId];

          if (parentNode) {
            // Create a new tree node for the note
            const newNoteNode: TreeNode = {
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
          } else {
            // Just navigate if we can't update the tree
            navigate(`/note/${result.id}`);
          }
        } else {
          console.error(`Failed to create note: ${result.message}`);
        }
      },
      separator: true,
    },
    {
      label: "Promote",
      action: (nodeId) => {
        console.log("Starting promotion");
        promoteTreeItem(
          nodeId,
          nodes(),
          setNodes,
          setCutId,
          getCutId,
          rootNodeId,
          moveItem,
          moveItemToRoot,
          promoteItem,
        ).then((success) => {
          if (success) {
            console.log("Promotion complete");
          } else {
            console.error("Promotion failed");
          }
        });
      },
    },
    {
      label: "Cut",
      action: (nodeId) => {
        setCutId(nodeId);
      },
    },
    {
      label: "Paste",
      action: (nodeId) => {
        // TODO Need to refactor the handlePasteEvent function to call something else that
        // only depends on nodeId
        pasteCutItemIntoFocusedItem(
          nodes,
          focusedId,
          getCutId,
          setCutId,
          setNodes,
          rootNodeId,
        );
      },
    },
    {
      label: "Rename",
      action: (nodeId) => {
        console.log(`Rename ${nodeId}`);
      },
    },
    {
      label: "Move to Root",
      action: (nodeId) => {
        moveNodeWithinTree(
          nodeId,
          "",
          nodes,
          setNodes,
          setCutId,
          getCutId,
          rootNodeId,
          moveItem,
          moveItemToRoot,
          true,
        ).then((success) => {
          if (!success) {
            console.error(`Failed to move item ${nodeId} to root`);
          }
        });
      },
    },
    {
      label: "Delete",
      action: (nodeId) => {
        if (confirm(`Are you sure you want to delete this item?`)) {
          removeNodeFromUI(
            nodeId,
            nodes,
            setNodes,
            setCutId,
            getCutId,
            focusedId,
            setFocusedId,
            () => getVisibleNodes(nodes, rootNodeId),
            deleteItem,
          ).then((success) => {
            if (!success) {
              console.error(`Failed to delete item ${nodeId}`);
            }
          });
        }
      },
      separator: true,
    },
    {
      label: "Copy Link",
      action: (nodeId) => {
        const url = `/note/${nodeId}`;
        if (isServer) return;
        navigator.clipboard
          .writeText(window.location.origin + url)
          .then(() => console.log("URL copied to clipboard"))
          .catch((err) => console.error("Failed to copy URL", err));
      },
      isNote: true,
    },
  ];

  return contextMenuItems;
}
