import { useNavigate } from "@solidjs/router";
import { ChevronRight } from "lucide-solid";
import {
  createEffect,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { isServer } from "solid-js/web";
import "./NoteTree.css";
import { Node } from "./treeCollection";

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
  horizontalScroll?: boolean;
  showVerticalLines?: boolean;
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
        const selectedId = props.selectedValues[0];
        setFocusedId(selectedId);
        setPrevSelectedId(selectedId);

        // Expand all parent nodes to reveal the selected node
        // This only happens on initial load or when URL changes
        setTimeout(() => expandParents(selectedId), 0); // Using setTimeout to ensure nodes state is set
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

  // Expand all parent nodes of a given node
  // This only expands parent folders, without modifying the target node itself
  function expandParents(nodeId: string): void {
    const nodeMap = nodes();
    let currentNode = nodeMap[nodeId];

    // Skip if node doesn't exist
    if (!currentNode) return;

    // Get current expanded state
    const expanded = getStoredExpanded();
    let hasChanges = false;

    // Traverse up the tree and expand all parent nodes
    while (
      currentNode &&
      currentNode.parent &&
      currentNode.parent !== props.collection.rootNode.id
    ) {
      const parentId = currentNode.parent;
      const parentNode = nodeMap[parentId];

      // If parent exists and is not expanded, expand it
      if (parentNode && !parentNode.isExpanded) {
        // Update node in the map
        setNodes({
          ...nodes(),
          [parentId]: { ...parentNode, isExpanded: true },
        });

        // Update expanded state for persistence
        expanded[parentId] = true;
        hasChanges = true;
      }

      // Move up to the next parent
      currentNode = parentNode;
    }

    // Save expanded state if changes were made
    if (hasChanges) {
      saveExpanded(expanded);
    }
  }

  // Track the previous selected ID to detect changes from URL params
  const [prevSelectedId, setPrevSelectedId] = createSignal<string>("");

  // Update focus when selected values change (typically from URL params)
  createEffect(() => {
    if (props.selectedValues?.length) {
      const selectedId = props.selectedValues[0];

      // Set the focused ID
      setFocusedId(selectedId);

      // Only expand parents when the selection changes due to URL params
      // This prevents re-expansion after user manually collapses folders
      if (prevSelectedId() !== selectedId) {
        expandParents(selectedId);
        setPrevSelectedId(selectedId);
      }
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
        // Allow users to toggle folders freely, even if they contain the current page
        toggleNode(currentId);
      } else {
        // For note nodes, just navigate - URL params will trigger the expansion
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
      // Allow users to toggle folders freely, even if they contain the current page
      toggleNode(id);
    } else {
      // For note nodes, just navigate - URL params will trigger the expansion
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

  const HORIZONTAL_WIDTH_REM = 1;

  // Render tree
  return (
    <div
      ref={(el) => (treeRef.current = el)}
      classList={{
        "tree-view rounded-md bg-[var(--color-base-100)] text-[var(--color-base-content)]":
          true,
        "w-max min-w-full": props.horizontalScroll,
      }}
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
                        "whitespace-nowrap w-max min-w-full":
                          props.horizontalScroll,
                      }}
                      style={{
                        "padding-left": `${(node().depth || 0) * HORIZONTAL_WIDTH_REM}rem`,
                      }}
                      data-part="item"
                      data-focus={isSelected() ? "true" : undefined}
                      onClick={() => handleNodeClick(nodeId)}
                    >
                      {/* Vertical depth lines */}
                      <Show when={props.showVerticalLines !== false}>
                        <For each={Array.from({ length: node().depth || 0 })}>
                          {(_, index) => (
                            <div
                              class="absolute w-[1px] h-full bg-[var(--color-base-300)] opacity-30 top-0 z-0 pointer-events-none"
                              style={{
                                left: `${index() * HORIZONTAL_WIDTH_REM}rem`,
                              }}
                            />
                          )}
                        </For>
                      </Show>
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
                        class={`flex items-center gap-2 ${props.horizontalScroll ? "whitespace-nowrap" : "truncate"}`}
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
