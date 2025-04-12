import { createSignal, For, Show, onMount, onCleanup } from "solid-js";
import { ShortcutDictionary } from "./KeyboardShortcuts";

interface ShortcutsOverlayProps {
  shortcuts: ShortcutDictionary;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Component that displays an overlay with all keyboard shortcuts
 */
export default function ShortcutsOverlay(props: ShortcutsOverlayProps) {
  /**
   * Format a key string for display
   */
  const formatKeyForDisplay = (keyString: string) => {
    return keyString
      .split('+')
      .map(part => {
        const trimmed = part.trim();
        if (trimmed === 'ctrl' || trimmed === 'control') return 'Ctrl';
        if (trimmed === 'alt') return 'Alt';
        if (trimmed === 'shift') return 'Shift';
        if (trimmed === 'meta' || trimmed === 'cmd' || trimmed === 'command') return '⌘';
        if (trimmed === 'escape') return 'Esc';
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      })
      .join(' + ');
  };

  // Handle escape key to close the overlay
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.isOpen) {
      props.onClose();
      // block the key going any further AI!
    }
  };

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });
  });

  return (
    <Show when={props.isOpen}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
        onClick={() => props.onClose()}
      >
        <div
          class="bg-base-200 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto m-4"
          onClick={(e) => e.stopPropagation()}
          style={{
            "background-color": "var(--color-base-200)",
            "border": "var(--border) solid var(--color-base-300)",
          }}
        >
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold" style={{ color: "var(--color-base-content)" }}>
                Keyboard Shortcuts
              </h2>
              <button
                class="p-2 rounded-full hover:bg-base-300 transition-colors"
                onClick={() => props.onClose()}
                aria-label="Close shortcuts overlay"
                style={{ color: "var(--color-base-content)" }}
              >
                ✕
              </button>
            </div>

            <div class="grid gap-4">
              <For each={Object.entries(props.shortcuts)}>
                {([id, shortcut]) => (
                  <div class="flex justify-between items-center p-2 hover:bg-base-300 rounded transition-colors">
                    <div style={{ color: "var(--color-base-content)" }}>
                      {shortcut.description || id}
                    </div>
                    <div
                      class="px-2 py-1 rounded bg-base-300 font-mono text-sm"
                      style={{
                        "background-color": "var(--color-base-300)",
                        color: "var(--color-base-content)"
                      }}
                    >
                      {formatKeyForDisplay(shortcut.key)}
                    </div>
                  </div>
                )}
              </For>
            </div>

            <div class="mt-6 text-sm text-center opacity-70" style={{ color: "var(--color-base-content)" }}>
              Press <kbd class="px-1 py-0.5 rounded bg-base-300">?</kbd> to toggle this overlay
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}
