import { createSignal } from "solid-js";
import { A } from "@solidjs/router";

/**
 * Navbar component for the Notetaking application
 * Includes app title, search, and mobile menu toggle
 * @param props Component properties
 * @returns Navbar component
 */
export default function Navbar(props: { toggleSidebar: () => void }) {
  const [searchQuery, setSearchQuery] = createSignal("");

  return (
    <nav class="fixed w-full z-10" style={{
      "background-color": "var(--color-base-100)",
      "border-bottom": "var(--border) solid var(--color-base-300)"
    }}>
      <div class="px-4 py-3 flex items-center justify-between">
        {/* Left side - Logo and mobile menu button */}
        <div class="flex items-center">
          <button
            onClick={props.toggleSidebar}
            class="md:hidden p-2 rounded-md focus:outline-none"
            style={{
              "color": "var(--color-base-content)",
              "border-radius": "var(--radius-field)"
            }}
            aria-label="Toggle sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <A href="/" class="flex items-center ml-2 md:ml-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              style={{ "color": "var(--color-primary)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span class="ml-2 text-xl font-semibold" style={{ "color": "var(--color-base-content)" }}>
              NoteKeeper
            </span>
          </A>
        </div>

        {/* Center - Search bar */}
        <div class="hidden md:block flex-1 max-w-md mx-4">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                class="h-5 w-5"
                style={{ "color": "var(--color-neutral)" }}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search notes..."
              class="block w-full pl-10 pr-3 py-2 leading-5 sm:text-sm"
              style={{
                "background-color": "var(--color-base-200)",
                "border": "var(--border) solid var(--color-base-300)",
                "border-radius": "var(--radius-field)",
                "color": "var(--color-base-content)",
                "placeholder-color": "var(--color-neutral)",
                "padding": "var(--size-field)"
              }}
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
            />
          </div>
        </div>

        {/* Right side - User menu */}
        <div class="flex items-center">
          <button class="p-2 rounded-full focus:outline-none" 
            style={{ 
              "color": "var(--color-base-content)",
              "border-radius": "var(--radius-selector)"
            }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
          <button class="ml-2 p-2 rounded-full focus:outline-none"
            style={{ 
              "color": "var(--color-base-content)",
              "border-radius": "var(--radius-selector)"
            }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      <div class="px-4 py-2 md:hidden">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              class="h-5 w-5" 
              style={{ "color": "var(--color-neutral)" }}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search notes..."
            class="block w-full pl-10 pr-3 py-2 leading-5 sm:text-sm"
            style={{
              "background-color": "var(--color-base-200)",
              "border": "var(--border) solid var(--color-base-300)",
              "border-radius": "var(--radius-field)",
              "color": "var(--color-base-content)",
              "placeholder-color": "var(--color-neutral)",
              "padding": "var(--size-field)"
            }}
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
          />
        </div>
      </div>
    </nav>
  );
}
