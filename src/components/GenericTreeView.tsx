import { For, Show, createEffect, createSignal, onMount } from "solid-js";
import { Node, NodeType } from "./treeCollection";
import { ChevronDown, ChevronRight, FileText, Folder, Tag } from "lucide-solid";
import { createStore, SetStoreFunction, produce } from "solid-js/store";

interface GenericTreeViewProps {
  collection: {
    rootNode: Node;
  };
}

export default function GenericTreeView(props: GenericTreeViewProps) {
  const [navMap, setNavMap] = createStore<Record<string, NavigationTargets>>({});
  const [focusedNodeId, setFocusedNodeId] = createSignal<string | null>(null);
  
  // Set initial focus to the root node when the component mounts
  onMount(() => {
    if (props.collection.rootNode) {
      setFocusedNodeId(props.collection.rootNode.id);
    }
  });
  
  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    const currentId = focusedNodeId();
    if (!currentId || !navMap[currentId]) return;
    
    const currentTargets = navMap[currentId];
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (currentTargets.up) {
          setFocusedNodeId(currentTargets.up);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (currentTargets.down) {
          setFocusedNodeId(currentTargets.down);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (currentTargets.parent) {
          setFocusedNodeId(currentTargets.parent);
        }
        break;
      case 'Home':
        e.preventDefault();
        // Find the first node in the tree
        if (props.collection.rootNode) {
          setFocusedNodeId(props.collection.rootNode.id);
        }
        break;
      case 'End':
        e.preventDefault();
        if (currentTargets.end) {
          setFocusedNodeId(currentTargets.end);
        }
        break;
    }
  };
  
  // Add keyboard event listener
  onMount(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });
  
  return (
    <div class="tree-view" tabIndex={0}>
      <TreeNode 
        node={props.collection.rootNode} 
        level={0} 
        navMap={navMap}
        setNavMap={setNavMap}
        parentId={null}
        siblingIds={[]}
        index={0}
        focusedNodeId={focusedNodeId}
        setFocusedNodeId={setFocusedNodeId}
      />
    </div>
  );
}

interface TreeNodeProps {
  node: Node;
  level: number;
  navMap: Record<string, NavigationTargets>;
  setNavMap: SetStoreFunction<Record<string, NavigationTargets>>;
  parentId: string | null;
  siblingIds: string[];
  index: number;
  focusedNodeId: () => string | null;
  setFocusedNodeId: (id: string) => void;
}

interface NavigationTargets {
    up: string | null;
    parent: string | null;
    down: string | null;
    end: string | null;
    home: string | null;
}

interface TreeNodeItemProps {
  node: Node;
  isExpanded: boolean;
  toggleExpand: (e: MouseEvent) => void;
  level: number;
  navMap: Record<string, NavigationTargets>;
  setNavMap: SetStoreFunction<Record<string, NavigationTargets>>;
  parentId: string | null;
  siblingIds: string[];
  index: number;
  focusedNodeId: () => string | null;
  setFocusedNodeId: (id: string) => void;
}

function TreeNodeItem(props: TreeNodeItemProps) {
  const hasChildren = () => props.node.children && props.node.children.length > 0;
  const isFocused = () => props.focusedNodeId() === props.node.id;

  const getNodeIcon = () => {
    switch (props.node.type) {
      case NodeType.FOLDER:
        return Folder;
      case NodeType.NOTE:
        return FileText;
      case NodeType.TAG:
        return Tag;
      default:
        return FileText;
    }
  };

  const NodeIcon = getNodeIcon();
  
  // Update navigation map when component mounts or relevant props change
  createEffect(() => {
    const currentId = props.node.id;
    const prevSibling = props.index > 0 ? props.siblingIds[props.index - 1] : null;
    const nextSibling = props.index < props.siblingIds.length - 1 ? props.siblingIds[props.index + 1] : null;
    
    // Find the last descendant (for "end" navigation)
    const findLastDescendant = (node: Node): string => {
      if (!node.children || node.children.length === 0) {
        return node.id;
      }
      return findLastDescendant(node.children[node.children.length - 1]);
    };
    
    // Calculate navigation targets
    const targets: NavigationTargets = {
      up: prevSibling,
      parent: props.parentId,
      down: nextSibling || (hasChildren() && props.isExpanded ? props.node.children![0].id : null),
      end: hasChildren() && props.isExpanded ? findLastDescendant(props.node) : null,
      home: props.level === 0 ? currentId : null // Root node is home
    };
    
    // Update the navigation map
    props.setNavMap(produce(state => {
      state[currentId] = targets;
    }));
  });

  // Handle click to focus this node
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    props.setFocusedNodeId(props.node.id);
  };

  return (
    <div
      class={`tree-node-content flex items-center py-1 px-2 rounded cursor-pointer ${
        isFocused() ? 'bg-blue-100' : 'hover:bg-gray-100'
      }`}
      style={{ "padding-left": `${props.level * 16 + 4}px` }}
      onClick={handleClick}
    >
      <Show when={hasChildren()}>
        <button
          class="mr-1 p-1 rounded hover:bg-gray-200"
          onClick={(e) => {
            e.stopPropagation();
            props.toggleExpand(e);
          }}
          aria-label={props.isExpanded ? "Collapse" : "Expand"}
        >
          {props.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </Show>

      <Show when={!hasChildren()}>
        <span class="w-6"></span>
      </Show>

      <NodeIcon size={16} class="mr-2" />
      <span class="text-sm">{props.node.name}</span>
    </div>
  );
}

function TreeNode(props: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = createSignal(props.level < 1);
  const hasChildren = () => props.node.children && props.node.children.length > 0;

  const toggleExpand = (e: MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded());
  };
  
  // Get sibling IDs for children to use in their navigation
  const childrenIds = () => 
    props.node.children ? props.node.children.map(child => child.id) : [];

  return (
    <div class="tree-node">
      <TreeNodeItem
        node={props.node}
        isExpanded={isExpanded()}
        toggleExpand={toggleExpand}
        level={props.level}
        navMap={props.navMap}
        setNavMap={props.setNavMap}
        parentId={props.parentId}
        siblingIds={props.siblingIds}
        index={props.index}
        focusedNodeId={props.focusedNodeId}
        setFocusedNodeId={props.setFocusedNodeId}
      />

      <Show when={isExpanded() && hasChildren()}>
        <div class="tree-node-children">
          <For each={props.node.children}>
            {(child, index) => (
              <TreeNode 
                node={child} 
                level={props.level + 1} 
                navMap={props.navMap}
                setNavMap={props.setNavMap}
                parentId={props.node.id}
                siblingIds={childrenIds()}
                index={index()}
                focusedNodeId={props.focusedNodeId}
                setFocusedNodeId={props.setFocusedNodeId}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
