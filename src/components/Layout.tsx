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
  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = createSignal(false);
  
  // Desktop sidebar resizing state
  const [sidebarWidth, setSidebarWidth] = createSignal(256);
  const [isResizing, setIsResizing] = createSignal(false);

  // Handle sidebar resizing
  const startResizing = (e: MouseEvent) => {
    if (typeof document === 'undefined') return;
    
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const updateResizing = (e: MouseEvent) => {
    if (!isResizing() || typeof document === 'undefined') return;
    
    const newWidth = e.clientX;
    const minWidth = 256;  // 16rem
    const maxWidth = 512;  // 32rem
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
      document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
    }
  };

  const stopResizing = () => {
    if (typeof document === 'undefined') return;
    
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  // Setup and cleanup resize event listeners
  onMount(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('mousemove', updateResizing);
      document.addEventListener('mouseup', stopResizing);
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
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen())} />
      
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

        {/* Desktop sidebar - resizable */}
        <div 
          class="hidden md:block fixed h-screen bg-[color:var(--color-base-200)] border-r border-[color:var(--color-base-300)] overflow-auto min-w-[16rem] max-w-[32rem]"
          style={{ width: `${sidebarWidth()}px` }}
        >
          <Sidebar />
          
          {/* Resize handle */}
          <div
            class="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[color:var(--color-primary)] opacity-0 hover:opacity-50 transition-opacity"
            onMouseDown={startResizing}
          />
        </div>

        {/* Main content */}
        <div class="flex-1 overflow-auto bg-[color:var(--color-base-100)] w-full md:pl-[var(--sidebar-width)]">
          <div class="container mx-auto p-4">
            {props.children}
          </div>
        </div>
      </div>
    </div>
  );
}
