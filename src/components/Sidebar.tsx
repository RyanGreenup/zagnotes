import { createSignal, Show, onMount } from "solid-js";
import { A } from "@solidjs/router";
import NavLink from "./NavLink";
import SectionHeader from "./SectionHeader";
import SubSectionHeader from "./SubSectionHeader";
import AnimatedListItem from "./AnimatedListItem";
import TreeView from "./TreeView";

/**
 * Sidebar component for the Notetaking application
 * Displays navigation links and recent notes
 * @param props Component properties with optional tree reference callback
 * @returns Sidebar component
 */
export default function Sidebar(props: { onTreeRef?: (ref: HTMLElement) => void }) {
  let treeRef: HTMLElement | undefined;
  const [recentNotes] = createSignal([
    { id: 1, title: "Meeting Notes" },
    { id: 2, title: "Project Ideas" },
    { id: 3, title: "Shopping List" },
  ]);

  // Dummy data for the wiki tree view
  const [wikiContent] = createSignal([
    {
      id: "1",
      name: "Documentation",
      type: "folder",
      children: [
        { id: "1-1", name: "Getting Started", type: "file" },
        { id: "1-2", name: "API Reference", type: "file" },
        {
          id: "1-3",
          name: "Tutorials",
          type: "folder",
          children: [
            { id: "1-3-1", name: "Beginner Guide", type: "file" },
            { id: "1-3-2", name: "Advanced Topics", type: "file" },
          ],
        },
      ],
    },
    {
      id: "2",
      name: "Projects",
      type: "folder",
      children: [
        { id: "2-1", name: "Project Alpha", type: "file" },
        { id: "2-2", name: "Project Beta", type: "file" },
      ],
    },
    {
      id: "3",
      name: "Team",
      type: "folder",
      children: [
        { id: "3-1", name: "Members", type: "file" },
        { id: "3-2", name: "Roles", type: "file" },
      ],
    },
    { id: "4", name: "FAQ", type: "file" },
  ]);

  const [isVisible, setIsVisible] = createSignal(false);

  onMount(() => {
    // Trigger entrance animation after component mounts
    setTimeout(() => setIsVisible(true), 100);
  });

  return (
    <aside
      class="h-full w-64 flex-shrink-0 transition-all duration-500 ease-in-out"
      classList={{
        "translate-x-0 opacity-100": isVisible(),
        "-translate-x-full opacity-0": !isVisible(),
      }}
      style={{
        "background-color": "var(--color-base-200)",
        "border-right": "var(--border) solid var(--color-base-300)",
      }}
    >
      <div class="p-4">
        <SectionHeader>Notes</SectionHeader>

        <div class="space-y-2">
          <NavLink href="/" end>
            All Notes
          </NavLink>
          <NavLink href="/favorites">Favorites</NavLink>
          <NavLink href="/trash">Trash</NavLink>
        </div>

        <div class="mt-8 animate-fadeIn">
          <SubSectionHeader>Recent Notes</SubSectionHeader>

          <ul class="space-y-1">
            {recentNotes().map((note, index) => (
              <AnimatedListItem index={index}>
                <NavLink href={`/note/${note.id}`}>{note.title}</NavLink>
              </AnimatedListItem>
            ))}
          </ul>
        </div>

        <div class="mt-8 animate-fadeIn">
          <SubSectionHeader>Wiki Content</SubSectionHeader>
          <div class="mt-2" aria-label="Wiki navigation tree">
            <TreeView 
              data={wikiContent()} 
              ref={(el) => {
                treeRef = el;
                if (props.onTreeRef) props.onTreeRef(el);
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
