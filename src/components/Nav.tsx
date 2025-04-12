import { useLocation } from "@solidjs/router";

/**
 * Navigation component for the application
 * @returns Navigation component
 */
export default function Nav() {
  const location = useLocation();
  const active = (path: string) =>
    path == location.pathname ? "border-sky-600" : "border-transparent hover:border-sky-600";
  
  return (
    <nav class="bg-sky-800 shadow-md">
      <div class="container flex items-center justify-between p-3 text-gray-200">
        <div class="flex items-center">
          {/* Drawer toggle button */}
          <label for="app-drawer" class="btn btn-ghost drawer-button mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </label>
          
          {/* App title */}
          <span class="text-xl font-bold">NoteWiki</span>
        </div>
        
        {/* Navigation links */}
        <ul class="flex items-center">
          <li class={`border-b-2 ${active("/")} mx-1.5 sm:mx-6`}>
            <a href="/">Home</a>
          </li>
          <li class={`border-b-2 ${active("/about")} mx-1.5 sm:mx-6`}>
            <a href="/about">About</a>
          </li>
          <li class={`border-b-2 ${active("/notes")} mx-1.5 sm:mx-6`}>
            <a href="/notes">Notes</a>
          </li>
        </ul>
        
        {/* Search button */}
        <button class="btn btn-ghost btn-circle">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
