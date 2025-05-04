import { useNavigate } from "@solidjs/router";
import type { ContextMenuItem } from "~/components/ContextMenu";
import { isServer } from "solid-js/web";
import { isFolder, toggleNode } from "./expand_and_collapse_item";
import {
  insertItemIntoTree,
  moveNodeWithinTree,
  removeNodeFromUI,
  promoteTreeItem,
  pasteCutItemIntoTarget,
  createNewNoteInTree,
  createNewFolderInTree,
} from "./insert_item";
import { NodeMap } from "./types";
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
        createNewFolderInTree(nodeId, nodes(), setNodes, setFocusedId);
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