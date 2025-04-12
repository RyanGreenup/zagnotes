import { createEffect, onCleanup } from "solid-js";

/**
 * Interface for keyboard shortcut definition
 */
interface KeyboardShortcut {
  /** Key or key combination (e.g., 'g', 'ctrl+s') */
  key: string;
  /** Function to execute when shortcut is triggered */
  action: () => void;
  /** Optional description for the shortcut */
  description?: string;
  /** Whether the shortcut should work when inside input fields */
  allowInInputs?: boolean;
}

/**
 * Props for the KeyboardShortcuts component
 */
interface KeyboardShortcutsProps {
  /** Array of keyboard shortcuts to register */
  shortcuts: KeyboardShortcut[];
}

/**
 * Component that registers global keyboard shortcuts
 * @param props Component properties with shortcuts configuration
 */
export default function KeyboardShortcuts(props: KeyboardShortcutsProps) {
  /**
   * Parse a key string into its components (modifiers and key)
   */
  const parseKeyString = (keyString: string) => {
    const parts = keyString.toLowerCase().split('+');
    const key = parts.pop() || '';
    const ctrl = parts.includes('ctrl') || parts.includes('control');
    const shift = parts.includes('shift');
    const alt = parts.includes('alt');
    const meta = parts.includes('meta') || parts.includes('cmd') || parts.includes('command');
    
    return { key, ctrl, shift, alt, meta };
  };

  /**
   * Handle keydown events and trigger the appropriate action
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    // Skip if the event target is an input element and the shortcut doesn't allow it
    const isInputElement = 
      event.target instanceof HTMLInputElement || 
      event.target instanceof HTMLTextAreaElement ||
      (event.target instanceof HTMLElement && event.target.isContentEditable);

    for (const shortcut of props.shortcuts) {
      const { key, ctrl, shift, alt, meta } = parseKeyString(shortcut.key);
      
      // Check if the shortcut matches the event
      const keyMatches = event.key.toLowerCase() === key;
      const ctrlMatches = event.ctrlKey === ctrl;
      const shiftMatches = event.shiftKey === shift;
      const altMatches = event.altKey === alt;
      const metaMatches = event.metaKey === meta;
      
      // Skip if we're in an input and the shortcut doesn't allow it
      if (isInputElement && !shortcut.allowInInputs) {
        continue;
      }

      // If all conditions match, execute the action
      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  };

  createEffect(() => {
    // Register the global event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up the event listener when the component is unmounted
    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });
  });

  // This component doesn't render anything
  return null;
}

/**
 * Hook to create a keyboard shortcuts configuration
 * @returns A utility object for working with keyboard shortcuts
 */
export function createKeyboardShortcuts() {
  const shortcuts: KeyboardShortcut[] = [];
  
  return {
    /**
     * Register a new keyboard shortcut
     * @param key Key or key combination (e.g., 'g', 'ctrl+s')
     * @param action Function to execute when shortcut is triggered
     * @param options Additional options for the shortcut
     */
    register: (
      key: string, 
      action: () => void, 
      options?: { description?: string; allowInInputs?: boolean }
    ) => {
      shortcuts.push({
        key,
        action,
        description: options?.description,
        allowInInputs: options?.allowInInputs
      });
    },
    
    /**
     * Get all registered shortcuts
     */
    getShortcuts: () => shortcuts
  };
}
