import { For, Show } from "solid-js";
import { Node, NodeType } from "./treeCollection";
import { ChevronDown, ChevronRight, FileText, Folder, Tag } from "lucide-solid";
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";

interface GenericTreeViewProps {
  collection: {
    rootNode: Node;
  };
}

export default function GenericTreeView(props: GenericTreeViewProps) {
  return (
    <div class="tree-view">
      <TreeNode node={props.collection.rootNode} level={0} />
    </div>
  );
}

interface TreeNodeProps {
  node: Node;
  level: number;
}

interface NavigationTargets {
    up: string;
    parent: string;
    down: string;
    end: string;
    home: string;
}

interface navMap {
    id: string;
    targets: NavigationTargets;
}

interface TreeNodeItemProps {
  node: Node;
  isExpanded: boolean;
  toggleExpand: (e: MouseEvent) => void;
  level: number;
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
  const [navMap, setNavMap] = createStore<navMap>({});

  const toggleExpand = (e: MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded());
  };

  return (
    <div class="tree-node">
      <TreeNodeItem 
        node={props.node} 
        isExpanded={isExpanded()} 
        toggleExpand={toggleExpand} 
        level={props.level} 
      />

      <Show when={isExpanded() && hasChildren()}>
        <div class="tree-node-children">
          <For each={props.node.children}>
            {(child) => <TreeNode node={child} level={props.level + 1} />}
          </For>
        </div>
      </Show>
    </div>
  );
}
