import { createSignal, JSX, Show } from "solid-js";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import KeyboardShortcuts, { createKeyboardShortcuts } from "./KeyboardShortcuts";

/**
 * Layout component for the Notetaking application
 * Handles responsive sidebar and main content layout
 * @param props Component properties with children
 * @returns Layout component
 */
export default function Layout(props: { children: JSX.Element }) {
  const [sidebarOpen, setSidebarOpen] = createSignal(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen());

  // Create keyboard shortcuts
  const keyboardManager = createKeyboardShortcuts();

  // Register global shortcuts
  keyboardManager.register(
    'search',
    '/',
    () => {
      // Focus the search input
      const searchInput = document.querySelector('input[type="search"]');
      if (searchInput instanceof HTMLInputElement) {
        searchInput.focus();
      }
    },
    { description: "Focus search" }
  );

  keyboardManager.register(
    'escape',
    'escape',
    () => {
      // Close sidebar on mobile
      if (sidebarOpen()) {
        setSidebarOpen(false);
      }
    },
    { description: "Close sidebar", allowInInputs: true }
  );

  keyboardManager.register(
    'toggleSidebar',
    'ctrl+b',
    toggleSidebar,
    { description: "Toggle sidebar" }
  );

  // Register shortcut to show keyboard shortcuts overlay
  keyboardManager.register(
    'showShortcuts',
    // Nothing happens when the user presses this keybinding, Reason through the code and Explain Why AI!
    'alt+h',
    () => keyboardManager.toggleOverlay(),
    { description: "Show keyboard shortcuts", allowInInputs: false }
  );

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
