import { createSignal, onMount } from "solid-js";
import NavLink from "./NavLink";
import { Tabs } from "@ark-ui/solid/tabs";
import SectionHeader from "./SectionHeader";
import SubSectionHeader from "./SubSectionHeader";
import AnimatedListItem from "./AnimatedListItem";
import ServerNoteTree from "./ServerNoteTree";
import {
  Clock,
  FolderTree,
  Link2,
  ExternalLink,
  Search,
  Pin,
} from "lucide-solid";
import "./TabFocus.css";
import Card from "./Card";

/**
 * Sidebar component for the Notetaking application
 * Displays navigation links and recent notes
 * @returns Sidebar component
 */
export default function Sidebar() {
  const [isVisible, setIsVisible] = createSignal(false);
  // Removed icon_class as it's now handled in CSS

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
      <Tabs.Root defaultValue="note_tree" class="flex flex-col h-full">
        {/* Tabs List -- Buttons showing the tabs*/}
        <Tabs.List class="flex-shrink-0">
          <Tabs.Trigger value="note_tree" title="Note Tree">
            <FolderTree />
            <span class="sr-only">Note Tree</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="backlinks" title="Backlinks">
            <Link2 />
            <span class="sr-only">Backlinks</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="forward_links" title="Forward Links">
            <ExternalLink />
            <span class="sr-only">Forward Links</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="search" title="Search">
            <Search />
            <span class="sr-only">Search</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="recent" title="Recent Notes">
            <Clock />
            <span class="sr-only">Recent Notes</span>
          </Tabs.Trigger>
        </Tabs.List>

        {/* Tab Content, what's shown when tab is selected*/}
        <div class="flex-grow overflow-auto">
          <Tabs.Content value="note_tree" class="h-full">
            <NoteTree />
          </Tabs.Content>
          <Tabs.Content value="backlinks">
            <Backlinks />
          </Tabs.Content>
          <Tabs.Content value="forward_links">
            <ForwardLinks />
          </Tabs.Content>
          <Tabs.Content value="search">
            <SearchBar />
          </Tabs.Content>
          <Tabs.Content value="recent">
            <RecentNotes />
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </aside>
  );
}

function RecentNotes() {
  return (
    <div class="p-2">
      <SectionHeader>Recent Notes</SectionHeader>
      <p class="text-xs text-neutral mt-1" style={{ color: "var(--color-neutral)" }}>
        Your recently accessed notes will appear here.
      </p>
    </div>
  );
}

function SearchBar() {
  return (
    <div class="p-2">
      <SectionHeader>Search</SectionHeader>
      <div class="mt-2 rounded-md" style={{ 
        border: "var(--border) solid var(--color-base-300)",
        backgroundColor: "var(--color-base-100)" 
      }}>
        <input 
          type="text" 
          placeholder="Search notes..." 
          class="w-full p-1.5 text-sm bg-transparent focus:outline-none"
          style={{ color: "var(--color-base-content)" }}
        />
      </div>
    </div>
  );
}

function Backlinks() {
  return (
    <div class="p-2">
      <SectionHeader>Backlinks</SectionHeader>
      <p class="text-xs mt-1" style={{ color: "var(--color-neutral)" }}>
        Notes that link to the current note will appear here.
      </p>
    </div>
  );
}

function ForwardLinks() {
  return (
    <div class="p-2">
      <SectionHeader>Forward Links</SectionHeader>
      <p class="text-xs mt-1" style={{ color: "var(--color-neutral)" }}>
        Notes that are linked from the current note will appear here.
      </p>
    </div>
  );
}

function PinnedNotes() {
  const [pinnedNotes] = createSignal([
    { id: 101, title: "Important Tasks" },
    { id: 102, title: "Research Paper" },
    { id: 103, title: "Project Roadmap" },
  ]);

  return (
    <div>
      <SubSectionHeader>Pinned Notes</SubSectionHeader>
      <ul class="space-y-0.5 mt-1">
        {pinnedNotes().map((note, index) => (
          <AnimatedListItem index={index}>
            <div class="flex items-center">
              <Pin class="h-3 w-3 mr-1 text-primary" />
              <NavLink href={`/note/${note.id}`}>{note.title}</NavLink>
            </div>
          </AnimatedListItem>
        ))}
      </ul>
    </div>
  );
}

function NoteTree() {
  const [recentNotes] = createSignal([
    { id: 1, title: "Meeting Notes" },
    { id: 2, title: "Project Ideas" },
    { id: 3, title: "Shopping List" },
  ]);

  return (
    <div class="p-2 overflow-y-auto h-full" style={{ 
      backgroundColor: "var(--color-base-100)" 
    }}>
      <ServerNoteTree />
      
      <div class="mt-3">
        <SectionHeader>Collections</SectionHeader>
        <div class="space-y-1 mt-1">
          <NavLink href="/" end>
            All Notes
          </NavLink>
          <NavLink href="/favorites">
            Favorites
          </NavLink>
          <NavLink href="/trash">
            Trash
          </NavLink>
        </div>
      </div>
      
      <div class="mt-3 animate-fadeIn">
        <PinnedNotes />
      </div>

      <div class="mt-3 animate-fadeIn">
        <SubSectionHeader>Recent Notes</SubSectionHeader>
        <ul class="space-y-0.5 mt-1">
          {recentNotes().map((note, index) => (
            <AnimatedListItem index={index}>
              <NavLink href={`/note/${note.id}`}>{note.title}</NavLink>
            </AnimatedListItem>
          ))}
        </ul>
      </div>
    </div>
  );
}
