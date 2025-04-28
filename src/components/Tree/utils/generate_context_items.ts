import { useNavigate } from "@solidjs/router";
import type { ContextMenuItem } from "~/components/ContextMenu";
import { isServer } from "solid-js/web";
import { isFolder, toggleNode, getStoredExpanded, saveExpanded } from "./expand_and_collapse_item";
import { createNewNote } from "~/lib/db-notes";
import { createFolder } from "~/lib/db-folder";
import {
  insertItemIntoTree,
  moveNodeWithinTree,
  removeNodeFromUI,
  promoteTreeItem,
  type NodeMap,
  pasteCutItemIntoTarget,
  createNewNoteInTree,
} from "./insert_item";
import {
  deleteItem,
  moveItem,
  moveItemToRoot,
  promoteItem,
} from "~/lib/utils/folders";
import { promptAndRenameItem } from "./rename_title";
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
        createNewNoteInTree(nodeId, nodes(), setNodes, setFocusedId, navigate);
      },
    },
    {
      label: "New Folder",
      action: async (nodeId) => {
        // Create a new folder in the selected folder
        const defaultTitle = "New Folder";
        const result = await createFolder(defaultTitle, nodeId);

        if (result.success && result.folder) {
          // Create a copy of the current nodes
          const nodeMap = nodes();
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
          }
        } else {
          console.error(`Failed to create folder: ${result.message}`);
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
        promptAndRenameItem(nodeId, nodes, setNodes)
          .then((success) => {
            if (!success) {
              console.error(`Failed to rename item ${nodeId}`);
            }
          });
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