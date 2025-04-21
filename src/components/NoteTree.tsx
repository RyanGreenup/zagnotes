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
import { ChevronRight, Folder } from "lucide-solid";

// Type definitions
type NodeMap = Record<string, TreeNode>;

interface TreeNode extends Node {
  isExpanded?: boolean;
  isFolder?: boolean;
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

// Helper functions
function isFolder(node: TreeNode): boolean {
  return Boolean(node.children && node.children.length > 0);
}

function flattenTree(
  node: TreeNode,
  nodeMap: NodeMap = {},
  depth = 0,
  parent = "",
  expandedState: Record<string, boolean> = {},
): NodeMap {
  // Determine if the node should be expanded based on saved state or default
  const isNodeExpanded =
    node.id in expandedState ? expandedState[node.id] : depth === 0; // Root node is expanded by default

  const nodeWithDepth = {
    ...node,
    depth,
    isFolder: isFolder(node),
    parent,
    isExpanded: isNodeExpanded,
  };

  nodeMap[node.id] = nodeWithDepth;

  if (node.children) {
    for (const child of node.children) {
      flattenTree(child, nodeMap, depth + 1, node.id, expandedState);
    }
  }

  return nodeMap;
}

function getVisibleNodes(nodes: NodeMap, rootId: string): string[] {
  const result: string[] = [];
  const stack: string[] = [rootId];

  while (stack.length > 0) {
    const nodeId = stack.pop()!;
    const node = nodes[nodeId];

    if (!node) continue;

    // Skip root node from visible list, but process its children
    if (nodeId !== rootId) {
      result.push(nodeId);
    }

    // If node is expanded and has children, add them to the stack
    if (node.isExpanded && node.children) {
      // Add in reverse order to maintain correct display order
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i].id);
      }
    }
  }

  return result;
}

function getNextNodeId(
  currentId: string,
  visibleNodes: string[],
  direction: "up" | "down",
): string {
  const currentIndex = visibleNodes.indexOf(currentId);
  if (currentIndex === -1) return visibleNodes[0] || "";

  if (direction === "down") {
    return visibleNodes[Math.min(currentIndex + 1, visibleNodes.length - 1)];
  } else {
    return visibleNodes[Math.max(currentIndex - 1, 0)];
  }
}

// Safe accessor function to handle potentially missing methods
function getNodeString(
  node: TreeNode,
  collection: TreeProps["collection"],
): string {
  if (collection.nodeToString) {
    try {
      return collection.nodeToString(node);
    } catch (e) {
      return node.name;
    }
  }
  return node.name;
}

function getNodeValue(
  node: TreeNode,
  collection: TreeProps["collection"],
): string {
  if (collection.nodeToValue) {
    try {
      return collection.nodeToValue(node);
    } catch (e) {
      return node.id;
    }
  }
  return node.id;
}

// Store tree expansion state in localStorage to persist across navigations
function getStoredExpandedState(): Record<string, boolean> {
  if (isServer) return {};

  try {
    const stored = localStorage.getItem("note-tree-expanded-state");
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
}

function saveExpandedState(expandedNodes: Record<string, boolean>): void {
  if (isServer) return;

  try {
    localStorage.setItem(
      "note-tree-expanded-state",
      JSON.stringify(expandedNodes),
    );
  } catch (e) {
    console.error("Failed to save tree state:", e);
  }
}

// Main tree component
export function Tree(props: TreeProps) {
  const [focusedId, setFocusedId] = createSignal<string>("");
  const [nodes, setNodes] = createSignal<NodeMap>({});
  const [visibleNodes, setVisibleNodes] = createSignal<string[]>([]);
  const [expandedState, setExpandedState] = createSignal<
    Record<string, boolean>
  >(getStoredExpandedState());

  const navigate = useNavigate();

  // Initialize node map from collection
  createEffect(() => {
    if (props.collection && props.collection.rootNode) {
      try {
        // Ensure rootNode has an id property
        const rootNode: TreeNode = {
          ...(props.collection.rootNode || {}),
          id: props.collection.rootNode.id || "ROOT",
        };

        // Ensure all nodes have minimum required properties
        const ensureNodeProperties = (node: any): TreeNode => {
          const result: TreeNode = {
            ...node,
            id: node.id || `node-${Math.random().toString(36).slice(2, 9)}`,
            name: node.name || node.id || "Unnamed",
          };

          if (node.children && Array.isArray(node.children)) {
            result.children = node.children.map(ensureNodeProperties);
          }

          return result;
        };

        const safeRootNode = ensureNodeProperties(rootNode);
        const currentExpandedState = expandedState();
        const nodeMap = flattenTree(
          safeRootNode,
          {},
          0,
          "",
          currentExpandedState,
        );
        setNodes(nodeMap);

        // Initialize visible nodes
        setVisibleNodes(getVisibleNodes(nodeMap, safeRootNode.id));

        // Set initial focus if there's a selected value
        if (props.selectedValues && props.selectedValues.length > 0) {
          setFocusedId(props.selectedValues[0]);
        } else {
          // Set focus to first visible node
          const visible = getVisibleNodes(nodeMap, safeRootNode.id);
          setFocusedId(visible[0] || "");
        }
      } catch (error) {
        console.error("Error initializing tree:", error);
      }
    }
  });

  // Update focused id when selected values change
  createEffect(() => {
    if (props.selectedValues && props.selectedValues.length > 0) {
      setFocusedId(props.selectedValues[0]);
    }
  });

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    const currentFocusedId = focusedId();
    if (!currentFocusedId) return;

    const nodeMap = nodes();
    const currentVisible = visibleNodes();

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        const nextId = getNextNodeId(currentFocusedId, currentVisible, "down");
        setFocusedId(nextId);
        break;

      case "ArrowUp":
        e.preventDefault();
        const prevId = getNextNodeId(currentFocusedId, currentVisible, "up");
        setFocusedId(prevId);
        break;

      case "ArrowRight":
        e.preventDefault();
        const node = nodeMap[currentFocusedId];
        if (node && node.isFolder && !node.isExpanded) {
          // Expand the folder
          setNodes((prev) => ({
            ...prev,
            [currentFocusedId]: { ...node, isExpanded: true },
          }));

          // Update expanded state
          const newExpandedState = {
            ...expandedState(),
            [currentFocusedId]: true,
          };
          setExpandedState(newExpandedState);
          saveExpandedState(newExpandedState);

          // Update visible nodes
          setVisibleNodes(
            getVisibleNodes(nodes(), props.collection.rootNode.id),
          );

          // Preserve focus
          setFocusedId(currentFocusedId);
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        const currentNode = nodeMap[currentFocusedId];
        if (currentNode) {
          if (currentNode.isFolder && currentNode.isExpanded) {
            // Collapse the folder
            setNodes((prev) => ({
              ...prev,
              [currentFocusedId]: { ...currentNode, isExpanded: false },
            }));

            // Update expanded state
            const newExpandedState = {
              ...expandedState(),
              [currentFocusedId]: false,
            };
            setExpandedState(newExpandedState);
            saveExpandedState(newExpandedState);

            // Update visible nodes
            setVisibleNodes(
              getVisibleNodes(nodes(), props.collection.rootNode.id),
            );

            // Preserve focus
            setFocusedId(currentFocusedId);
          } else if (
            currentNode.parent &&
            currentNode.parent !== props.collection.rootNode.id
          ) {
            // Move focus to parent
            setFocusedId(currentNode.parent);
          }
        }
        break;

      case "Enter":
      case " ":
        e.preventDefault();
        const targetNode = nodeMap[currentFocusedId];
        if (targetNode) {
          if (targetNode.isFolder) {
            // Toggle folder expansion
            const newIsExpanded = !targetNode.isExpanded;
            setNodes((prev) => ({
              ...prev,
              [currentFocusedId]: {
                ...targetNode,
                isExpanded: newIsExpanded,
              },
            }));

            // Update expanded state
            const newExpandedState = {
              ...expandedState(),
              [currentFocusedId]: newIsExpanded,
            };
            setExpandedState(newExpandedState);
            saveExpandedState(newExpandedState);

            // Update visible nodes
            setVisibleNodes(
              getVisibleNodes(nodes(), props.collection.rootNode.id),
            );

            // Preserve focus
            setFocusedId(currentFocusedId);
          } else {
            // Navigate to the note
            navigate(`/note/${currentFocusedId}`);
          }
        }
        break;
    }
  };

  // Toggle node expansion
  const toggleNode = (id: string) => {
    const nodeMap = nodes();
    const node = nodeMap[id];
    const currentFocused = focusedId();

    if (!node || !node.isFolder) return;

    const newIsExpanded = !node.isExpanded;

    // Update node state
    setNodes((prev) => ({
      ...prev,
      [id]: { ...node, isExpanded: newIsExpanded },
    }));

    // Update expanded state
    const newExpandedState = { ...expandedState(), [id]: newIsExpanded };
    setExpandedState(newExpandedState);
    saveExpandedState(newExpandedState);

    // Update visible nodes
    setVisibleNodes(getVisibleNodes(nodes(), props.collection.rootNode.id));

    // Make sure we preserve focus
    if (currentFocused) {
      setFocusedId(currentFocused);
    }
  };

  // Setup keyboard event listeners - only in browser environment
  onMount(() => {
    if (!isServer) {
      document.addEventListener("keydown", handleKeyDown);
    }
  });

  onCleanup(() => {
    if (!isServer) {
      document.removeEventListener("keydown", handleKeyDown);
    }
  });

  return (
    <div
      class="tree-view w-full rounded-md bg-[var(--color-base-100)] text-[var(--color-base-content)]"
      tabIndex={0}
      data-scope="tree-view"
      aria-label="Note Tree"
    >
      <ul class="py-1">
        <Show when={props.collection?.rootNode?.children}>
          <For each={visibleNodes()}>
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
                      class={`
                        flex items-center px-2 py-1 cursor-pointer
                        ${isSelected() ? "bg-[var(--color-base-300)] text-[var(--color-primary)]" : "hover:bg-[var(--color-base-200)]"}
                      `}
                      style={{
                        "padding-left": `${(node().depth || 0) * 1.25}rem`,
                      }}
                      data-part="item"
                      data-focus={isSelected() ? "true" : undefined}
                      onClick={() => {
                        setFocusedId(nodeId);
                        if (node().isFolder) {
                          toggleNode(nodeId);
                        } else {
                          navigate(`/note/${nodeId}`);
                        }
                      }}
                    >
                      <Show when={node().isFolder}>
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
                          node().isFolder ? "branch-text" : "item-text"
                        }
                      >
                        <span class="truncate">
                          {getNodeString(node(), props.collection)}
                        </span>
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

// Provider component for backward compatibility
export function RootProvider(props: TreeProps) {
  return <Tree {...props} />;
}

export default Tree;
