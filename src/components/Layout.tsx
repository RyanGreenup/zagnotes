import { createSignal, JSX, Show } from "solid-js";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import KeyboardShortcuts, { createKeyboardShortcuts } from "./KeyboardShortcuts";
import { getAppShortcuts } from "../shortcuts/appShortcuts";

/**
 * Layout component for the Notetaking application
 * Handles responsive sidebar and main content layout
 * @param props Component properties with children
 * @returns Layout component
 */
export default function Layout(props: { children: JSX.Element }) {
  const [sidebarOpen, setSidebarOpen] = createSignal(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen());
  
  // Function to open the sidebar if it's closed (does nothing if already open)
  const openSidebar = () => {
    if (!sidebarOpen()) {
      setSidebarOpen(true);
    }
  };

  // Create keyboard shortcuts manager
  const keyboardManager = createKeyboardShortcuts();
  
  // Define callback functions for shortcuts
  const focusSearch = () => {
    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput instanceof HTMLInputElement) {
      searchInput.focus();
    }
  };
  
  const closeSidebar = () => {
    if (sidebarOpen()) {
      setSidebarOpen(false);
    }
  };
  
  // Get application shortcuts with our callback functions
  const appShortcuts = getAppShortcuts({
    focusSearch,
    closeSidebar,
    toggleSidebar,
    toggleShortcutsOverlay: () => keyboardManager.toggleOverlay()
  });
  
  // Register all shortcuts
  Object.entries(appShortcuts).forEach(([id, shortcut]) => {
    keyboardManager.register(
      id,
      shortcut.key,
      shortcut.action,
      { 
        description: shortcut.description,
        allowInInputs: shortcut.allowInInputs
      }
    );
  });

  return (
    <div
      class="flex flex-col h-screen"
      style={{
        "background-color": "var(--color-base-100)",
        color: "var(--color-base-content)",
      }}
    >
      <Navbar toggleSidebar={toggleSidebar} />

      <div class="flex flex-1 pt-16">
        {/* Mobile sidebar overlay */}
        <Show when={sidebarOpen()}>
          <div
            class="fixed inset-0 z-20 backdrop-blur-sm md:hidden"
            style={{
              "background-color": "var(--color-base-200)",
              opacity: "0.7",
            }}
            onClick={() => setSidebarOpen(false)}
          />
        </Show>

        {/* Mobile sidebar */}
        <div
          class={`fixed z-30 inset-y-0 left-0 w-64 transition duration-300 transform md:hidden ${
            sidebarOpen() ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{
            "background-color": "var(--color-base-200)",
            "border-right": "var(--border) solid var(--color-base-300)",
          }}
        >
          <Sidebar />
        </div>

        {/* Desktop sidebar */}
        <div
          class="hidden md:block"
          style={{
            "background-color": "var(--color-base-200)",
            "border-right": "var(--border) solid var(--color-base-300)",
          }}
        >
          <Sidebar />
        </div>

        {/* Main content */}
        <div
          class="flex-1 overflow-auto"
          style={{ "background-color": "var(--color-base-100)" }}
        >
          <div class="container mx-auto p-4">{props.children}</div>
        </div>
      </div>

      {/* Register global keyboard shortcuts */}
      <KeyboardShortcuts shortcuts={keyboardManager.getShortcuts()} />
    </div>
  );
}
