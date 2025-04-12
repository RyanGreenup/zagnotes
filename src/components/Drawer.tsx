import { JSX, createSignal, Show } from "solid-js";

/**
 * Drawer component for the application
 * @param props Component properties
 * @returns Drawer component
 */
export default function Drawer(props: { children: JSX.Element }) {
  const [isOpen, setIsOpen] = createSignal(false);

  const toggleDrawer = () => {
    setIsOpen(!isOpen());
  };

  return (
    <div class="drawer">
      <input 
        id="app-drawer" 
        type="checkbox" 
        class="drawer-toggle" 
        checked={isOpen()} 
        onChange={toggleDrawer} 
      />
      <div class="drawer-content flex flex-col">
        {/* Page content here */}
        {props.children}
      </div>
      <div class="drawer-side">
        <label for="app-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
        <ul class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
          <li class="mb-2 font-bold text-lg">Notes</li>
          <li><a href="/notes/recent">Recent Notes</a></li>
          <li><a href="/notes/all">All Notes</a></li>
          <li class="mt-4 mb-2 font-bold text-lg">Categories</li>
          <li><a href="/categories">Manage Categories</a></li>
          <li class="mt-4 mb-2 font-bold text-lg">Settings</li>
          <li><a href="/settings">Application Settings</a></li>
        </ul>
      </div>
    </div>
  );
}
