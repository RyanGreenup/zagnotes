import { createSignal, Show, onMount } from "solid-js";
import { A } from "@solidjs/router";

/**
 * Sidebar component for the Notetaking application
 * Displays navigation links and recent notes
 * @returns Sidebar component
 */
export default function Sidebar() {
  const [recentNotes] = createSignal([
    { id: 1, title: "Meeting Notes" },
    { id: 2, title: "Project Ideas" },
    { id: 3, title: "Shopping List" },
  ]);
  
  const [isVisible, setIsVisible] = createSignal(false);
  
  onMount(() => {
    // Trigger entrance animation after component mounts
    setTimeout(() => setIsVisible(true), 100);
  });

  return (
    <aside 
      class={`h-full w-64 flex-shrink-0 transition-all duration-500 ease-in-out ${isVisible() ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`} 
      style={{
        "background-color": "var(--color-base-200)",
        "border-right": "var(--border) solid var(--color-base-300)"
      }}
    >
      <div class="p-4">
        <h2 
          class="text-xl font-semibold mb-4 transition-all duration-300 transform hover:scale-105 origin-left"
          style={{ "color": "var(--color-base-content)" }}
        >
          Notes
        </h2>

        <div class="space-y-2">
          <A
            href="/"
            class="block p-2 rounded font-medium transition-all duration-200 transform hover:translate-x-2 hover:bg-opacity-80 hover:shadow-md"
            style={{ 
              "color": "var(--color-base-content)",
              "border-radius": "var(--radius-field)"
            }}
            activeClass="active-link"
            end
          >
            All Notes
          </A>
          <A
            href="/favorites"
            class="block p-2 rounded font-medium transition-all duration-200 transform hover:translate-x-2 hover:bg-opacity-80 hover:shadow-md"
            style={{ 
              "color": "var(--color-base-content)",
              "border-radius": "var(--radius-field)"
            }}
            activeClass="active-link"
          >
            Favorites
          </A>
          <A
            href="/trash"
            class="block p-2 rounded font-medium transition-all duration-200 transform hover:translate-x-2 hover:bg-opacity-80 hover:shadow-md"
            style={{ 
              "color": "var(--color-base-content)",
              "border-radius": "var(--radius-field)"
            }}
            activeClass="active-link"
          >
            Trash
          </A>
        </div>

        <div class="mt-8 animate-fadeIn">
          <h3 
            class="text-sm font-semibold uppercase tracking-wider mb-2 transition-all duration-300 hover:tracking-widest"
            style={{ "color": "var(--color-neutral)" }}
          >
            Recent Notes
          </h3>
          <ul class="space-y-1">
            {recentNotes().map((note, index) => (
              <li 
                class="transform transition-all duration-300"
                style={{ "animation": `fadeSlideIn 0.5s ease-out ${index * 0.1 + 0.2}s both` }}
              >
                <A
                  href={`/note/${note.id}`}
                  class="block p-2 rounded truncate transition-all duration-200 hover:pl-4 hover:bg-opacity-80 hover:shadow-sm"
                  style={{ 
                    "color": "var(--color-base-content)",
                    "border-radius": "var(--radius-field)"
                  }}
                  activeClass="active-link"
                >
                  {note.title}
                </A>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
