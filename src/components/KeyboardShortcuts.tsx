import { createEffect, onCleanup } from "solid-js";

/**
 * Interface for keyboard shortcut definition
 */
export interface KeyboardShortcut {
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
 * Type for keyboard shortcut dictionary
 * Keys are shortcut identifiers, values are shortcut definitions
 */
export type ShortcutDictionary = Record<string, KeyboardShortcut>;

/**
 * Props for the KeyboardShortcuts component
 */
interface KeyboardShortcutsProps {
  /** Dictionary of keyboard shortcuts to register */
  shortcuts: ShortcutDictionary;
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

    for (const id in props.shortcuts) {
      const shortcut = props.shortcuts[id];
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
  const shortcuts: ShortcutDictionary = {};
  
  return {
    /**
     * Register a new keyboard shortcut
     * @param id Unique identifier for the shortcut
     * @param key Key or key combination (e.g., 'g', 'ctrl+s')
     * @param action Function to execute when shortcut is triggered
     * @param options Additional options for the shortcut
     */
    register: (
      id: string,
      key: string, 
      action: () => void, 
      options?: { description?: string; allowInInputs?: boolean }
    ) => {
      shortcuts[id] = {
        key,
        action,
        description: options?.description,
        allowInInputs: options?.allowInInputs
      };
    },
    
    /**
     * Update an existing shortcut
     * @param id Identifier of the shortcut to update
     * @param updates Partial shortcut definition to update
     */
    updateShortcut: (
      id: string,
      updates: Partial<KeyboardShortcut>
    ) => {
      if (shortcuts[id]) {
        shortcuts[id] = { ...shortcuts[id], ...updates };
      }
    },
    
    /**
     * Remove a shortcut by its identifier
     * @param id Identifier of the shortcut to remove
     */
    removeShortcut: (id: string) => {
      delete shortcuts[id];
    },
    
    /**
     * Get all registered shortcuts
     */
    getShortcuts: () => shortcuts
  };
}
