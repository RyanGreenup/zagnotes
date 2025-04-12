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
    <aside class="h-full bg-gray-50 border-r border-gray-200 w-64 flex-shrink-0">
      <div class="p-4">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Notes</h2>

        <div class="space-y-2">
          <A
            href="/"
            class="block p-2 rounded hover:bg-gray-200 text-gray-700 font-medium"
            activeClass="bg-gray-200 text-sky-700"
            end
          >
            All Notes
          </A>
          <A
            href="/favorites"
            class="block p-2 rounded hover:bg-gray-200 text-gray-700 font-medium"
            activeClass="bg-gray-200 text-sky-700"
          >
            Favorites
          </A>
          <A
            href="/trash"
            class="block p-2 rounded hover:bg-gray-200 text-gray-700 font-medium"
            activeClass="bg-gray-200 text-sky-700"
          >
            Trash
          </A>
        </div>

        <div class="mt-8">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Recent Notes
          </h3>
          <ul class="space-y-1">
            {recentNotes().map((note) => (
              <li>
                <A
                  href={`/note/${note.id}`}
                  class="block p-2 rounded hover:bg-gray-200 text-gray-700 truncate"
                  activeClass="bg-gray-200 text-sky-700"
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
