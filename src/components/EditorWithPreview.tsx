import { createSignal, JSX, onMount, onCleanup, createEffect } from "solid-js";
import Preview from "./Preview";
import CodeMirrorNoteEditor from "./CodeMirrorNoteEditor";

const MIN_PANEL_WIDTH = 20; // Minimum width percentage for each panel
const STORAGE_KEY = "editorSplitPosition";

export default function EditorWithPreview(props: {
  content: Accessor<string | undefined>;
  setContent: Setter<string>;
  class?: string;
  viewMode?: "split" | "editor" | "preview";
  onViewModeChange?: (mode: "split" | "editor" | "preview") => void;
}) {
  // Load initial split position from localStorage or use default
  const [splitPosition, setSplitPosition] = createSignal(
    Number(localStorage.getItem(STORAGE_KEY)) || 50
  );
  const [isDragging, setIsDragging] = createSignal(false);
  const [viewMode, setViewMode] = createSignal<"split" | "editor" | "preview">("split");

  // Save split position to localStorage when it changes
  createEffect(() => {
    localStorage.setItem(STORAGE_KEY, splitPosition().toString());
  });

  const startDrag = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging()) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const container = document.querySelector('.editor-preview-container');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const relativeX = clientX - containerRect.left;
    const percentage = Math.min(100 - MIN_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, (relativeX / containerRect.width) * 100));
    
    setSplitPosition(percentage);
  };

  const stopDrag = () => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  // Setup event listeners
  onMount(() => {
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', handleDrag);
    document.addEventListener('touchend', stopDrag);
  });

  onCleanup(() => {
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', handleDrag);
    document.removeEventListener('touchend', stopDrag);
  });

  // Keyboard shortcuts for view modes
  onMount(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '\\') {
        e.preventDefault();
        setViewMode(prev => {
          if (prev === 'split') return 'editor';
          if (prev === 'editor') return 'preview';
          return 'split';
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div class={`editor-preview-container flex flex-1 h-full ${props.class || ''}`}>
      {/* Editor */}
      <Show when={viewMode() !== 'preview'}>
        <div 
          class="h-full overflow-auto" 
          style={{ 
            width: viewMode() === 'split' ? `${splitPosition()}%` : '100%',
            display: viewMode() === 'preview' ? 'none' : 'block'
          }}
        >
          <CodeMirrorNoteEditor 
            content={props.content}
            setContent={props.setContent}
          />
        </div>
      </Show>

      {/* Splitter - only shown in split view */}
      <Show when={viewMode() === 'split'}>
        <div
          class="w-2 h-full bg-[color:var(--color-base-200)] hover:bg-[color:var(--color-primary)] active:bg-[color:var(--color-primary)] cursor-col-resize transition-colors z-10 opacity-0 hover:opacity-100"
          onMouseDown={startDrag}
          onTouchStart={startDrag}
        />
      </Show>

      {/* Preview */}
      <Show when={viewMode() !== 'editor'}>
        <div 
          class="h-full overflow-auto" 
          style={{ 
            width: viewMode() === 'split' ? `${100 - splitPosition()}%` : '100%',
            display: viewMode() === 'editor' ? 'none' : 'block'
          }}
        >
          <div class="h-full overflow-auto">
            <Preview content={() => props.content() || ''} renderOnServer={false} />
          </div>
        </div>
      </Show>
    </div>
  );
}
