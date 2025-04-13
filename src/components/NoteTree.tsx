import { TreeView, createTreeCollection, useTreeView } from '@ark-ui/solid/tree-view'
import { CheckSquareIcon, ChevronRightIcon, FileIcon, FolderIcon } from 'lucide-solid'
import { For, Show } from 'solid-js'

interface Node {
  id: string
  name: string
  children?: Node[]
}

const collection = createTreeCollection<Node>({
  nodeToValue: (node) => node.id,
  nodeToString: (node) => node.name,
  rootNode: {
    id: 'ROOT',
    name: '',
    children: [
      {
        id: 'node_modules',
        name: 'node_modules',
        children: [
          { id: 'node_modules/zag-js', name: 'zag-js' },
          { id: 'node_modules/pandacss', name: 'panda' },
          {
            id: 'node_modules/@types',
            name: '@types',
            children: [
              { id: 'node_modules/@types/react', name: 'react' },
              { id: 'node_modules/@types/react-dom', name: 'react-dom' },
            ],
          },
        ],
      },
      {
        id: 'src',
        name: 'src',
        children: [
          { id: 'src/app.tsx', name: 'app.tsx' },
          { id: 'src/index.ts', name: 'index.ts' },
        ],
      },
      { id: 'panda.config', name: 'panda.config.ts' },
      { id: 'package.json', name: 'package.json' },
      { id: 'renovate.json', name: 'renovate.json' },
      { id: 'readme.md', name: 'README.md' },
    ],
  },
})

export const RootProvider = () => {
  const treeView = useTreeView({ collection })

  return (
    <TreeView.RootProvider value={treeView}>
      <TreeView.Label class="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-neutral)" }}>Tree</TreeView.Label>
      <TreeView.Tree class="rounded-lg overflow-hidden" style={{ 
        "background-color": "var(--color-base-200)",
        "border": "var(--border) solid var(--color-base-300)",
        "border-radius": "var(--radius-box)"
      }}>
        <For each={collection.rootNode.children}>{(node, index) => <TreeNode node={node} indexPath={[index()]} />}</For>
      </TreeView.Tree>
    </TreeView.RootProvider>
  )
}

const TreeNode = (props: TreeView.NodeProviderProps<Node>) => {
  const { node, indexPath } = props
  return (
    <TreeView.NodeProvider node={node} indexPath={indexPath}>
      <Show
        when={node.children}
        fallback={
          <TreeView.Item class="py-1.5 px-3 hover:bg-opacity-70 transition-all duration-200 flex items-center gap-2 cursor-pointer" style={{ 
            "background-color": "var(--color-base-200)",
            "border-radius": "var(--radius-field)",
            "color": "var(--color-base-content)"
          }}>
            <TreeView.ItemIndicator class="text-xs opacity-80" style={{ color: "var(--color-primary)" }}>
              <CheckSquareIcon class="h-4 w-4" />
            </TreeView.ItemIndicator>
            <TreeView.ItemText class="flex items-center gap-2 font-medium">
              <FileIcon class="h-4 w-4 opacity-70" style={{ color: "var(--color-secondary)" }} />
              <span class="text-sm">{node.name}</span>
            </TreeView.ItemText>
          </TreeView.Item>
        }
      >
        <TreeView.Branch class="animate-fadeIn">
          <TreeView.BranchControl class="py-1.5 px-3 hover:bg-opacity-80 flex items-center justify-between w-full cursor-pointer transition-all duration-200" style={{ 
            "background-color": "var(--color-base-200)",
            "border-radius": "var(--radius-field)",
            "color": "var(--color-base-content)"
          }}>
            <TreeView.BranchText class="flex items-center gap-2 font-medium">
              <FolderIcon class="h-4 w-4" style={{ color: "var(--color-primary)" }} /> 
              <span class="text-sm">{node.name}</span>
            </TreeView.BranchText>
            <TreeView.BranchIndicator class="transition-transform duration-200 transform">
              <ChevronRightIcon class="h-4 w-4 opacity-70" />
            </TreeView.BranchIndicator>
          </TreeView.BranchControl>
          <TreeView.BranchContent class="pl-4 mt-1">
            <TreeView.BranchIndentGuide class="border-l-2 border-opacity-30 ml-2 pl-2" style={{ "border-color": "var(--color-base-300)" }} />
            <For each={node.children}>
              {(child, index) => <TreeNode node={child} indexPath={[...indexPath, index()]} />}
            </For>
          </TreeView.BranchContent>
        </TreeView.Branch>
      </Show>
    </TreeView.NodeProvider>
  )
}
