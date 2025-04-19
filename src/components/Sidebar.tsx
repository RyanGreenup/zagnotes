import { createSignal, Show, onMount } from "solid-js";
import { A } from "@solidjs/router";
import NavLink from "./NavLink";
import { Tabs } from "@ark-ui/solid/tabs";
import SectionHeader from "./SectionHeader";
import SubSectionHeader from "./SubSectionHeader";
import AnimatedListItem from "./AnimatedListItem";
import ServerNoteTree from "./ServerNoteTree";
import {
  Clock,
  FolderTree,
  ForwardIcon,
  Link,
  Search,
  Trees,
} from "lucide-solid";
import "./TabFocus.css";

/**
 * Sidebar component for the Notetaking application
 * Displays navigation links and recent notes
 * @returns Sidebar component
 */
export default function Sidebar() {
  const [isVisible, setIsVisible] = createSignal(false);

  onMount(() => {
    // Trigger entrance animation after component mounts
    setTimeout(() => setIsVisible(true), 100);
  });

  return (
    <aside
      class="h-full w-64 flex-shrink-0 transition-all duration-500 ease-in-out flex flex-col"
      classList={{
        "translate-x-0 opacity-100": isVisible(),
        "-translate-x-full opacity-0": !isVisible(),
      }}
      style={{
        "background-color": "var(--color-base-200)",
        "border-right": "var(--border) solid var(--color-base-300)",
      }}
    >
      <Tabs.Root>
        <Tabs.List>
          <Tabs.Trigger value="note_tree">
            {" "}
            <FolderTree />{" "}
          </Tabs.Trigger>
          <Tabs.Trigger value="backlinks">
            {" "}
            <Link />{" "}
          </Tabs.Trigger>
          <Tabs.Trigger value="forward_links">
            {" "}
            <ForwardIcon />{" "}
          </Tabs.Trigger>
          <Tabs.Trigger value="search">
            {" "}
            <Search />{" "}
          </Tabs.Trigger>
          <Tabs.Trigger value="recent">
            {" "}
            <Clock />{" "}
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="note_tree">
          <NoteTree />
        </Tabs.Content>
        <Tabs.Content value="backlinks">Backlinks </Tabs.Content>
        <Tabs.Content value="forward_links">Forward Links</Tabs.Content>
        <Tabs.Content value="search">Search Bar</Tabs.Content>
        <Tabs.Content value="recent">Recent Items</Tabs.Content>
      </Tabs.Root>
    </aside>
  );
}

function NoteTree() {
  const [recentNotes] = createSignal([
    { id: 1, title: "Meeting Notes" },
    { id: 2, title: "Project Ideas" },
    { id: 3, title: "Shopping List" },
  ]);

  return (
    <>
      <div class="p-4 overflow-y-auto flex-1 hover:pr-2 transition-all duration-300">
        <ServerNoteTree />
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
      </div>
    </>
  );
}
