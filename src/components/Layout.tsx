import { createSignal, JSX, Show, onMount } from "solid-js";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

/**
 * Layout component for the Notetaking application
 * Handles responsive sidebar and main content layout
 * @param props Component properties with children
 * @returns Layout component
 */
export default function Layout(props: { children: JSX.Element }) {
  const [sidebarOpen, setSidebarOpen] = createSignal(false);
  const [sidebarWidth, setSidebarWidth] = createSignal(256);
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen());
  
  onMount(() => {
    // Add resize handler to desktop sidebar
    const resizeHandle = document.querySelector('.resize-handle') as HTMLDivElement;
    if (resizeHandle) {
      let isResizing = false;
      let initialX = 0;
      let initialWidth = 0;
      
      const onMouseDown = (e: MouseEvent) => {
        isResizing = true;
        initialX = e.clientX;
        initialWidth = sidebarWidth();
        
        document.body.classList.add('resizing');
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };
      
      const onMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;
        
        const newWidth = initialWidth + (e.clientX - initialX);
        if (newWidth >= 200 && newWidth <= 500) {
          setSidebarWidth(newWidth);
          document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
        }
      };
      
      const onMouseUp = () => {
        isResizing = false;
        document.body.classList.remove('resizing');
        
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      
      resizeHandle.addEventListener('mousedown', onMouseDown);
    }
    
    // Set initial CSS variable
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth()}px`);
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
          class={`fixed z-30 inset-y-0 left-0 w-64 transition duration-300 transform md:hidden h-full ${
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
          class="hidden md:block h-screen fixed"
          style={{
            "background-color": "var(--color-base-200)",
            "border-right": "var(--border) solid var(--color-base-300)",
            "width": "var(--sidebar-width, 256px)"
          }}
        >
          <Sidebar />
          <div 
            class="absolute top-0 right-0 h-full w-1 cursor-ew-resize hover:bg-blue-400 opacity-0 hover:opacity-100 transition-opacity resize-handle" 
          />
        </div>

        {/* Main content */}
        <div
          class="flex-1 overflow-auto"
          style={{ 
            "background-color": "var(--color-base-100)",
            "margin-left": "var(--sidebar-width, 256px)"
          }}
        >
          <div class="container mx-auto p-4">{props.children}</div>
        </div>
      </div>
    </div>
  );
}