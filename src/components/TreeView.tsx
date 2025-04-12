import { createSignal, For, Show } from "solid-js";
import IconWrapper from "./IconWrapper";
import { ChevronRight, ChevronDown, File, Folder } from "lucide-solid";

/**
 * Interface for tree node items
 */
interface TreeNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: TreeNode[];
}

/**
 * Props for the TreeView component
 */
interface TreeViewProps {
  data: TreeNode[];
}

/**
 * Props for the TreeItem component
 */
interface TreeItemProps {
  node: TreeNode;
  level: number;
}

/**
 * Individual tree item component that can be a file or folder
 * Folders can be expanded to show their children
 */
function TreeItem(props: TreeItemProps) {
  const [expanded, setExpanded] = createSignal(false);
  const toggleExpand = () => setExpanded(!expanded());
  
  const isFolder = props.node.type === "folder";
  const hasChildren = isFolder && props.node.children && props.node.children.length > 0;
  
  return (
    <li class="select-none">
      <div 
        class="flex items-center py-1 px-1 hover:bg-base-300 rounded cursor-pointer transition-colors"
        style={{ "padding-left": `${props.level * 12}px` }}
        onClick={hasChildren ? toggleExpand : undefined}
      >
        {hasChildren ? (
          <span class="mr-1">
            <IconWrapper 
              icon={expanded() ? ChevronDown : ChevronRight} 
              size="sm"
              class="text-neutral"
            />
          </span>
        ) : (
          <span class="w-5"></span>
        )}
        
        <IconWrapper 
          icon={isFolder ? Folder : File} 
          size="sm"
          class={isFolder ? "text-primary" : "text-neutral"}
        />
        
        <span class="ml-2 text-sm">{props.node.name}</span>
      </div>
      
      <Show when={expanded() && hasChildren}>
        <ul class="ml-2">
          <For each={props.node.children}>
            {(child) => <TreeItem node={child} level={props.level + 1} />}
          </For>
        </ul>
      </Show>
    </li>
  );
}

/**
 * TreeView component that displays hierarchical data
 */
export default function TreeView(props: TreeViewProps) {
  return (
    <ul class="w-full">
      <For each={props.data}>
        {(node) => <TreeItem node={node} level={0} />}
      </For>
    </ul>
  );
}
