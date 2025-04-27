import { createSignal, JSX, Show, onMount, onCleanup } from "solid-js";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

/**
 * Layout component for the Notetaking application
 * Handles responsive sidebar and main content layout
 * @param props Component properties with children
 * @returns Layout component
 */
export default function Layout(props: { children: JSX.Element }) {
  // Sidebar width constants
  const SIDEBAR_MIN_WIDTH = 64; // 4rem
  const SIDEBAR_DEFAULT_WIDTH = 256; // 16rem
  const SIDEBAR_MAX_WIDTH_REM = 512; // 32rem
  const SIDEBAR_MAX_WIDTH_PERCENT = 0.8; // 80% of viewport

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = createSignal(false);

  // Desktop sidebar resizing state
  const [sidebarWidth, setSidebarWidth] = createSignal(SIDEBAR_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = createSignal(false);

  // Calculate max width based on viewport
  const getMaxWidth = () => {
    if (typeof window === 'undefined') return SIDEBAR_MAX_WIDTH_REM;
    return Math.max(SIDEBAR_MAX_WIDTH_REM, window.innerWidth * SIDEBAR_MAX_WIDTH_PERCENT);
  };

  // Handle sidebar resizing
  const startResizing = (e: MouseEvent | TouchEvent) => {
    if (typeof document === 'undefined') return;

    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const updateResizing = (e: MouseEvent | TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    if (!isResizing() || typeof document === 'undefined') return;

    const newWidth = clientX;
    const maxWidth = getMaxWidth();

    if (newWidth >= SIDEBAR_MIN_WIDTH && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
      document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
    }
  };

  const stopResizing = () => {
    if (typeof document === 'undefined') return;

    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.touchAction = '';
  };

  // Setup and cleanup resize event listeners
  onMount(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('mousemove', updateResizing);
      document.addEventListener('mouseup', stopResizing);

      document.addEventListener('touchmove', updateResizing);
      document.addEventListener('touchend', stopResizing);

      // Initialize sidebar width CSS variable
      document.documentElement.style.setProperty('--sidebar-width', `${SIDEBAR_DEFAULT_WIDTH}px`);
    }
  });

  onCleanup(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('mousemove', updateResizing);
      document.removeEventListener('mouseup', stopResizing);
    }
  });

  return (
    <div class="flex flex-col h-screen bg-[color:var(--color-base-100)] text-[color:var(--color-base-content)]">
      <Navbar
        toggleSidebar={() => setSidebarOpen(!sidebarOpen())}
        isSidebarOpen={sidebarOpen()}
      />

      <div class="flex flex-1 pt-[var(--navbar-height)]">
        {/* Mobile sidebar overlay */}
        <Show when={sidebarOpen()}>
          <div
            class="fixed inset-0 z-20 bg-[color:var(--color-base-200)] opacity-70 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        </Show>

        {/* Mobile sidebar */}
        <div
          class={`fixed z-30 inset-y-0 left-0 w-3/4 h-full md:hidden bg-[color:var(--color-base-200)] border-r border-[color:var(--color-base-300)] transition-transform duration-300 ${
            sidebarOpen() ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar />
        </div>

        {/* Desktop sidebar - resizable when open */}
        <Show when={sidebarOpen()}>
          <div
            class="hidden md:block fixed h-screen bg-[color:var(--color-base-200)] border-r border-[color:var(--color-base-300)] overflow-auto"
            style={{
              width: `${sidebarWidth()}px`,
              minWidth: `${SIDEBAR_MIN_WIDTH}px`,
            }}
          >
            <Sidebar />


            {/* Resize handle */}
            <div
              class="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-[color:var(--color-primary)] opacity-30 hover:opacity-70 transition-opacity"
              onMouseDown={startResizing}
              onTouchStart={startResizing}
            />
          </div>
        </Show>

        {/* Main content */}
        <div class={`flex-1 overflow-auto bg-[color:var(--color-base-100)] w-full ${
          sidebarOpen() ? "md:pl-[var(--sidebar-width)]" : ""
        }`}>
          <div class="container mx-auto p-0 h-full">
            {props.children}
          </div>
        </div>
      </div>
    </div>
  );
}
