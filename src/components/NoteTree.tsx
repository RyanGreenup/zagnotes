import {
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  For,
  Show,
} from "solid-js";
import { useNavigate } from "@solidjs/router";
import { isServer } from "solid-js/web";
import "./NoteTree.css";
import { Node } from "./treeCollection";
import { ChevronRight } from "lucide-solid";

// Types
interface TreeNode extends Node {
  isExpanded?: boolean;
  depth?: number;
  parent?: string;
}

interface TreeProps {
  collection: {
    rootNode: TreeNode;
    nodeToValue?: (node: TreeNode) => string;
    nodeToString?: (node: TreeNode) => string;
  };
  selectedValues?: string[];
}

type NodeMap = Record<string, TreeNode>;

// Main Tree Component
export function Tree(props: TreeProps) {
  // Core state
  const [nodes, setNodes] = createSignal<NodeMap>({});
  const [focusedId, setFocusedId] = createSignal<string>("");
  const [isTreeFocused, setIsTreeFocused] = createSignal(false);
  const treeRef = { current: null as HTMLDivElement | null };
  const navigate = useNavigate();

  // Get expanded state from localStorage
  function getStoredExpanded(): Record<string, boolean> {
    if (isServer) return {};
    try {
      const stored = localStorage.getItem("tree-expanded-state");
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }

  // Save expanded state to localStorage
  function saveExpanded(expanded: Record<string, boolean>): void {
    if (isServer) return;
    try {
      localStorage.setItem("tree-expanded-state", JSON.stringify(expanded));
    } catch (e) {
      console.error("Failed to save tree state");
    }
  }

  // Helper function to check if a node is a folder
  function isFolder(node: TreeNode): boolean {
    return Boolean(node.children && node.children.length > 0);
  }

  // Get node name safely
  function getNodeName(node: TreeNode): string {
    if (props.collection.nodeToString) {
      try {
        return props.collection.nodeToString(node);
      } catch {
        return node.name;
      }
    }
    return node.name;
  }

  // Get visible nodes in display order
  function getVisibleNodes(): string[] {
    const nodeMap = nodes();
    const rootId = props.collection.rootNode.id;
    const result: string[] = [];
    const stack: string[] = [rootId];

    while (stack.length > 0) {
      const id = stack.pop()!;
      const node = nodeMap[id];

      if (!node) continue;

      // Skip root node from visible list
      if (id !== rootId) {
        result.push(id);
      }

      // Add children if expanded
      if (node.isExpanded && node.children) {
        // Add in reverse order for correct display
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push(node.children[i].id);
        }
      }
    }

    return result;
  }

  // Initialize the tree
  createEffect(() => {
    if (!props.collection?.rootNode) return;

    try {
      // Process the tree and create a flat node map
      const expandedState = getStoredExpanded();
      const nodeMap: NodeMap = {};

      function processNode(node: any, depth = 0, parent = ""): void {
        // Ensure node has all necessary properties
        const id = node.id || `node-${Math.random().toString(36).slice(2, 9)}`;
        const processedNode: TreeNode = {
          ...node,
          id,
          name: node.name || id || "Unnamed",
          depth,
          parent,
          // Root node is expanded by default, otherwise check stored state
          isExpanded: id in expandedState ? expandedState[id] : depth === 0,
        };

        // Add to node map
        nodeMap[id] = processedNode;

        // Process children recursively
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child: any) =>
            processNode(child, depth + 1, id),
          );
        }
      }

      // Start processing from root
      processNode(props.collection.rootNode);
      setNodes(nodeMap);

      // Set initial focus
      if (props.selectedValues?.length) {
        setFocusedId(props.selectedValues[0]);
      } else {
        const visible = getVisibleNodes();
        if (visible.length > 0) {
          setFocusedId(visible[0]);
        }
      }
    } catch (error) {
      console.error("Error initializing tree:", error);
    }
  });

  // Update focus when selected values change
  createEffect(() => {
    if (props.selectedValues?.length) {
      setFocusedId(props.selectedValues[0]);
    }
  });

  // Toggle node expansion - central function for all expansion operations
  function toggleNode(id: string): void {
    const nodeMap = nodes();
    const node = nodeMap[id];

    // Only folders can be toggled
    if (!node || !isFolder(node)) return;

    // Remember current focused item
    const currentFocused = focusedId();

    // Toggle expansion state
    const newIsExpanded = !node.isExpanded;

    // Update node state
    setNodes({
      ...nodeMap,
      [id]: { ...node, isExpanded: newIsExpanded },
    });

    // Persist expanded state
    const expanded = getStoredExpanded();
    expanded[id] = newIsExpanded;
    saveExpanded(expanded);

    // Ensure focus is maintained
    setFocusedId(currentFocused);
  }

  // Handle keyboard navigation
  function handleKeyDown(e: KeyboardEvent): void {
    // Only handle keyboard events when the tree is focused
    if (!isTreeFocused()) return;

    const currentId = focusedId();
    if (!currentId) return;

    const nodeMap = nodes();
    const node = nodeMap[currentId];
    const visible = getVisibleNodes();
    const currentIndex = visible.indexOf(currentId);

    function focusDown(e: KeyboardEvent): void {
      e.preventDefault();
      if (currentIndex < visible.length - 1) {
        setFocusedId(visible[currentIndex + 1]);
      }
    }

    function focusUp(e: KeyboardEvent): void {
      e.preventDefault();
      if (currentIndex > 0) {
        setFocusedId(visible[currentIndex - 1]);
      }
    }

    function expandFocused(e: KeyboardEvent): void {
      e.preventDefault();
      // Expand folder if collapsed
      if (isFolder(node) && !node.isExpanded) {
        toggleNode(currentId);
      }
    }

    function collapseFocused(e: KeyboardEvent): void {
      e.preventDefault();
      if (isFolder(node) && node.isExpanded) {
        // Collapse folder
        toggleNode(currentId);
      } else if (node.parent && node.parent !== props.collection.rootNode.id) {
        // Move focus to parent
        setFocusedId(node.parent);
      }
    }

    function expandSpaceFocused(e: KeyboardEvent): void {
      e.preventDefault();
      if (isFolder(node)) {
        toggleNode(currentId);
      } else {
        navigate(`/note/${currentId}`);
      }
    }

    switch (e.key) {
      case "ArrowDown":
        focusDown(e);
        break;

      case "j":
        focusDown(e);
        break;

      case "ArrowUp":
        focusUp(e);
        break;

      case "k":
        focusUp(e);
        break;

      case "ArrowRight":
        expandFocused(e);
        break;

      case "l":
        expandFocused(e);
        break;

      case "ArrowLeft":
        collapseFocused(e);
        break;

      case "h":
        collapseFocused(e);
        break;

      case "Enter":
      case " ":
        expandSpaceFocused(e);
        break;
    }
  }

  // Handle node click
  function handleNodeClick(id: string): void {
    const node = nodes()[id];

    // Set focus
    setFocusedId(id);

    // Toggle folder or navigate to note
    if (isFolder(node)) {
      toggleNode(id);
    } else {
      navigate(`/note/${id}`);
    }
  }

  // Setup focus and keyboard event handlers
  onMount(() => {
    if (!isServer) {
      // Global keyboard event listener
      document.addEventListener("keydown", handleKeyDown);

      // Set up focus tracking if we have a reference
      if (treeRef.current) {
        // Focus events
        treeRef.current.addEventListener("focusin", () =>
          setIsTreeFocused(true),
        );
        treeRef.current.addEventListener("focusout", () =>
          setIsTreeFocused(false),
        );
      }
    }
  });

  onCleanup(() => {
    if (!isServer) {
      // Clean up event listeners
      document.removeEventListener("keydown", handleKeyDown);

      if (treeRef.current) {
        treeRef.current.removeEventListener("focusin", () =>
          setIsTreeFocused(true),
        );
        treeRef.current.removeEventListener("focusout", () =>
          setIsTreeFocused(false),
        );
      }
    }
  });

  // Render tree
  return (
    <div
      ref={(el) => (treeRef.current = el)}
      class="tree-view w-full rounded-md bg-[var(--color-base-100)] text-[var(--color-base-content)]"
      tabIndex={0}
      data-scope="tree-view"
      aria-label="Note Tree"
      onFocus={() => setIsTreeFocused(true)}
      onBlur={() => setIsTreeFocused(false)}
    >
      <ul class="py-1">
        <Show when={props.collection?.rootNode?.children}>
          <For each={getVisibleNodes()}>
            {(nodeId) => {
              const node = () => nodes()[nodeId];
              const isSelected = () => nodeId === focusedId();

              return (
                <Show when={node()}>
                  <li
                    class="flex flex-col"
                    aria-expanded={node().isExpanded}
                    data-state={node().isExpanded ? "open" : "closed"}
                  >
                    <div
                      classList={{
                        "flex items-center px-2 py-1 cursor-pointer": true,
                        "bg-[var(--color-base-300)] text-[var(--color-primary)]":
                          isSelected(),
                        "hover:bg-[var(--color-base-200)]": !isSelected(),
                      }}
                      style={{
                        "padding-left": `${(node().depth || 0) * 1.25}rem`,
                      }}
                      data-part="item"
                      data-focus={isSelected() ? "true" : undefined}
                      onClick={() => handleNodeClick(nodeId)}
                    >
                      <Show when={isFolder(node())}>
                        <span
                          class="mr-1 inline-flex justify-center items-center w-4 h-4 transition-transform duration-150"
                          style={{
                            transform: node().isExpanded
                              ? "rotate(90deg)"
                              : "rotate(0deg)",
                          }}
                          data-part="branch-indicator"
                        >
                          <ChevronRight />
                        </span>
                      </Show>

                      <span
                        class="flex items-center gap-2 truncate"
                        data-part={
                          isFolder(node()) ? "branch-text" : "item-text"
                        }
                      >
                        <span class="truncate">{getNodeName(node())}</span>
                      </span>
                    </div>
                  </li>
                </Show>
              );
            }}
          </For>
        </Show>
      </ul>
    </div>
  );
}

// Provider for backward compatibility
export function RootProvider(props: TreeProps) {
  return <Tree {...props} />;
}

export default Tree;
