import { createSignal, Show } from "solid-js";
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

  return (
    <aside class="h-full w-64 flex-shrink-0" style={{
      "background-color": "var(--color-base-200)",
      "border-right": "var(--border) solid var(--color-base-300)"
    }}>
      <div class="p-4">
        <h2 class="text-xl font-semibold mb-4" style={{ "color": "var(--color-base-content)" }}>Notes</h2>

        <div class="space-y-2">
          <A
            href="/"
            class="block p-2 rounded font-medium"
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
            class="block p-2 rounded font-medium"
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
            class="block p-2 rounded font-medium"
            style={{ 
              "color": "var(--color-base-content)",
              "border-radius": "var(--radius-field)"
            }}
            activeClass="active-link"
          >
            Trash
          </A>
        </div>

        <div class="mt-8">
          <h3 class="text-sm font-semibold uppercase tracking-wider mb-2" style={{ "color": "var(--color-neutral)" }}>
            Recent Notes
          </h3>
          <ul class="space-y-1">
            {recentNotes().map((note) => (
              <li>
                <A
                  href={`/note/${note.id}`}
                  class="block p-2 rounded truncate"
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
