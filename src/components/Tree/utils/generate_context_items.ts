import { useNavigate } from "@solidjs/router";
import type { ContextMenuItem } from "~/components/ContextMenu";
import { isServer } from "solid-js/web";
import { isFolder, toggleNode } from "./expand_and_collapse_item";
import { createNewNote } from "~/lib/db-notes";
import {
  insertItemIntoTree,
  moveNodeWithinTree,
  removeNodeFromUI,
  promoteTreeItem,
  type NodeMap,
  pasteCutItemIntoTarget,
} from "./insert_item";
import {
  deleteItem,
  moveItem,
  moveItemToRoot,
  promoteItem,
} from "~/lib/utils/folders";
import { Accessor, Setter } from "solid-js";

export function generateContextMenuItems(
  nodes: Accessor<NodeMap>,
  setNodes: Setter<NodeMap>,
  focusedId: Accessor<string>,
  setFocusedId: Setter<string>,
  setCutId: Setter<string>,
  getCutId: Accessor<string>,
  rootNodeId: string,
  navigate: ReturnType<typeof useNavigate>,
  getVisibleNodes: () => string[],
): ContextMenuItem[] {
  return [
    {
      label: "Open",
      action: (nodeId) => {
        if (isFolder(nodes()[nodeId])) {
          console.log(`Toggle ${nodeId}`);
          toggleNode(nodeId, nodes, setNodes, focusedId(), setFocusedId);
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

        if (result.success) {
          // Create a copy of the current nodes
          const nodeMap = nodes();
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
      action: () => {
        pasteCutItemIntoTarget(
          getCutId(),
          focusedId(),
          nodes(),
          setNodes,
          setCutId,
          getCutId,
          rootNodeId,
          moveItem,
          moveItemToRoot,
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
          nodes(),
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
            nodes(),
            setNodes,
            setCutId,
            getCutId,
            focusedId(),
            setFocusedId,
            getVisibleNodes,
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
}
