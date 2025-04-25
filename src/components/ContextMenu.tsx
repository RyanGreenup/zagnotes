import { useNavigate } from "@solidjs/router";
import { ChevronRight } from "lucide-solid";
import {
  createEffect,
  createSignal,
  For,
  JSX,
  onCleanup,
  onMount,
  Show,
  createMemo,
} from "solid-js";
import { isServer, Portal } from "solid-js/web";
import "./NoteTree.css";
import { Node } from "./treeCollection";
import { TreeNode } from "@ark-ui/solid";
import { isFolder } from "./NoteTree";

interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  nodeId: string;
  node: TreeNode;
  onClose: () => void;
}

// Context menu types
export interface ContextMenuItem {
  label: string;
  action: (nodeId: string) => void;
  icon?: JSX.Element;
  separator?: boolean;
  disabled?: boolean | ((node: TreeNode) => boolean);
  isFolder?: boolean; // If true, only show for folders
  isNote?: boolean; // If true, only show for notes
}

// Context Menu Component
export function ContextMenu(props: ContextMenuProps) {
  const filteredItems = createMemo(() => {
    return props.items.filter((item) => {
      // Skip items that don't match the node type (folder/note)
      if (item.isFolder && !isFolder(props.node)) return false;
      if (item.isNote && isFolder(props.node)) return false;

      // Check disabled state
      if (typeof item.disabled === "function") {
        return !item.disabled(props.node);
      }
      return !item.disabled;
    });
  });

  function handleClickOutside(e: MouseEvent) {
    props.onClose();
  }

  // Position the menu to ensure it stays in viewport
  const style = createMemo(() => {
    // Get viewport dimensions
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Menu dimensions (rough estimate - could be improved)
    const menuWidth = 200;
    const menuHeight = filteredItems().length * 36;

    // Calculate position to keep menu in viewport
    let x = props.x;
    let y = props.y;

    // Adjust horizontal position if needed
    if (x + menuWidth > vw) {
      x = vw - menuWidth - 5;
    }

    // Adjust vertical position if needed
    if (y + menuHeight > vh) {
      y = vh - menuHeight - 5;
    }

    return {
      left: `${x}px`,
      top: `${y}px`,
    };
  });

  // Close on ESC key
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      props.onClose();
    }
  }

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
  });

  onCleanup(() => {
    document.removeEventListener("click", handleClickOutside);
    document.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div
      class="fixed z-50 min-w-[200px] bg-[var(--color-base-100)] shadow-lg rounded-md text-[var(--color-base-content)] border border-[var(--color-base-300)]"
      style={style()}
      onClick={(e) => e.stopPropagation()}
    >
      <div class="py-1">
        <For each={filteredItems()}>
          {(item) => (
            <>
              <button
                type="button"
                onClick={() => {
                  item.action(props.nodeId);
                  props.onClose();
                }}
                class="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-[var(--color-base-200)]"
                disabled={!!item.disabled}
              >
                {item.icon && <span class="w-4 h-4">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
              {item.separator && (
                <div class="h-px bg-[var(--color-base-300)] my-1 mx-2"></div>
              )}
            </>
          )}
        </For>
      </div>
    </div>
  );
}
