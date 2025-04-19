import { For, Show, createEffect } from "solid-js";
import { Node, NodeType } from "./treeCollection";
import { ChevronDown, ChevronRight, FileText, Folder, Tag } from "lucide-solid";
import { createSignal } from "solid-js";
import { createStore, SetStoreFunction, produce } from "solid-js/store";

interface GenericTreeViewProps {
  collection: {
    rootNode: Node;
  };
}

export default function GenericTreeView(props: GenericTreeViewProps) {
  const [navMap, setNavMap] = createStore<Record<string, NavigationTargets>>({});
  
  return (
    <div class="tree-view">
      <TreeNode 
        node={props.collection.rootNode} 
        level={0} 
        navMap={navMap}
        setNavMap={setNavMap}
        parentId={null}
        siblingIds={[]}
        index={0}
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
}

function TreeNodeItem(props: TreeNodeItemProps) {
  const hasChildren = () => props.node.children && props.node.children.length > 0;

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
    
    // Find the first node in the tree (for "home" navigation)
    const findFirstNode = (rootNode: Node): string => {
      return rootNode.id;
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

  return (
    <div
      class="tree-node-content flex items-center py-1 px-2 rounded hover:bg-gray-100 cursor-pointer"
      style={{ "padding-left": `${props.level * 16 + 4}px` }}
      onClick={props.toggleExpand}
    >
      <Show when={hasChildren()}>
        <button
          class="mr-1 p-1 rounded hover:bg-gray-200"
          onClick={props.toggleExpand}
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
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
