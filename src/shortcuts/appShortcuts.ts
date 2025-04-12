import { ShortcutDictionary } from "../components/KeyboardShortcuts";

/**
 * Application-wide keyboard shortcuts
 */
export function getAppShortcuts(callbacks: {
  focusSearch: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  toggleShortcutsOverlay: () => void;
  focusTree: () => void;
}): ShortcutDictionary {
  return {
    'search': {
      key: '/',
      action: callbacks.focusSearch,
      description: "Focus search"
    },
    'escape': {
      key: 'escape',
      action: callbacks.closeSidebar,
      description: "Close sidebar",
      allowInInputs: true
    },
    'toggleSidebar': {
      key: 'ctrl+b',
      action: callbacks.toggleSidebar,
      description: "Toggle sidebar"
    },
    'showShortcuts': {
      key: 'alt+h',
      action: callbacks.toggleShortcutsOverlay,
      description: "Show keyboard shortcuts",
      allowInInputs: false
    },
    'focusTree': {
      key: 'alt+g',
      action: callbacks.focusTree,
      description: "Focus navigation tree"
    }
  };
}
