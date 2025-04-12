import { createSignal, JSX, Show } from "solid-js";
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
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen());
  
  return (
    <div class="flex flex-col h-screen">
      <Navbar toggleSidebar={toggleSidebar} />
      
      <div class="flex flex-1 pt-16">
        {/* Mobile sidebar overlay */}
        <Show when={sidebarOpen()}>
          <div 
            class="fixed inset-0 z-20 bg-gray-600 bg-opacity-75 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        </Show>
        
        {/* Mobile sidebar */}
        <div 
          class={`fixed z-30 inset-y-0 left-0 w-64 transition duration-300 transform md:hidden ${
            sidebarOpen() ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar />
        </div>
        
        {/* Desktop sidebar */}
        <Sidebar />
        
        {/* Main content */}
        <div class="flex-1 overflow-auto">
          <div class="container mx-auto p-4">
            {props.children}
          </div>
        </div>
      </div>
    </div>
  );
}
