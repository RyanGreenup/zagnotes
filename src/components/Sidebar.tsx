import { createSignal, onMount, onCleanup } from "solid-js";
import NavLink from "./NavLink";
import { Tabs } from "@ark-ui/solid/tabs";
import SectionHeader from "./SectionHeader";
import SubSectionHeader from "./SubSectionHeader";
import AnimatedListItem from "./AnimatedListItem";
import ServerNoteTree from "./ServerNoteTree";
import { ROUTES } from "../constants/routes";
import {
  Clock,
  FolderTree,
  Link2,
  ExternalLink,
  Search,
  Pin,
  FileStack,
} from "lucide-solid";
import "./TabFocus.css";
import Card from "./Card";
import RecentNotes from "./RecentNotes";
import SearchBar from "./SearchBar";
import Backlinks from "./BackLinks";
import ForwardLinks from "./ForwardLinks";
import SimilarNotes from "./SimilarNotes";
import PinnedNotes from "./PinnedNotes";

/**
 * Sidebar component for the Notetaking application
 * Displays navigation links and recent notes
 * @returns Sidebar component
 */
export default function Sidebar() {
  const [isVisible, setIsVisible] = createSignal(false);
  const [width, setWidth] = createSignal(256); // Default width
  const [isResizing, setIsResizing] = createSignal(false);

  const handleMouseDown = (e: MouseEvent) => {
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing()) return;
    const newWidth = e.clientX;
    const maxWidth = window.innerWidth * 0.8
    if (newWidth > 200 && newWidth < maxWidth) { // Min and max width constraints
      setWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  onMount(() => {
    if (typeof window !== 'undefined') {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    setTimeout(() => setIsVisible(true), 100);
  });

  onCleanup(() => {
    if (typeof window !== 'undefined') {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  });

  enum TabEnum {
    NOTE_TREE = "note_tree",
    BACKLINKS = "backlinks",
    FORWARDLINKS = "forwardlinks",
    SIMILAR = "similar",
    SEARCH = "search",
    RECENT = "recent",
  }

  return (
    <aside
      class="h-full flex-shrink-0 flex flex-col relative w-96 md:w-[var(--sidebar-width)]"
      style={{
        "--sidebar-width": `${width()}px`,
        "background-color": "var(--color-base-200)",
        "border-right": "var(--border) solid var(--color-base-300)",
      }}
      classList={{
        "translate-x-0 opacity-100": isVisible(),
        "-translate-x-full opacity-0": !isVisible(),
      }}
    >
      <Tabs.Root defaultValue={TabEnum.NOTE_TREE} class="flex flex-col h-full">
        {/* Tabs List -- Buttons showing the tabs*/}
        <Tabs.List
          class="flex-shrink-0 sticky top-0 z-10"
          style={{
            "height": "var(--navbar-height)",
            "background-color": "var(--color-base-200)"
          }}
        >
          <Tabs.Trigger value="note_tree" title="Note Tree">
            <FolderTree />
            <span class="sr-only">Note Tree</span>
          </Tabs.Trigger>
          <Tabs.Trigger value={TabEnum.BACKLINKS} title="Backlinks">
            <Link2 />
            <span class="sr-only">Backlinks</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="forward_links" title="Forward Links">
            <ExternalLink />
            <span class="sr-only">Forward Links</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="similar" title="Similar Notes">
            <FileStack />
            <span class="sr-only">Similar Notes</span>
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
        <div class="flex-grow overflow-auto" style={{"height": "calc(100% - var(--navbar-height))"}}>
          <Tabs.Content value="note_tree" class="h-full">
            <NoteTree />
          </Tabs.Content>
          <Tabs.Content value="backlinks">
            <Backlinks />
          </Tabs.Content>
          <Tabs.Content value="forward_links">
            <ForwardLinks />
          </Tabs.Content>
          <Tabs.Content value="similar">
            <SimilarNotes />
          </Tabs.Content>
          <Tabs.Content value="search">
            <SearchBar />
          </Tabs.Content>
          <Tabs.Content value="recent">
            <RecentNotes />
          </Tabs.Content>
        </div>
      </Tabs.Root>
      <div
        class="hidden md:block resize-handle"
        onMouseDown={handleMouseDown}
      />
    </aside>
  );
}

function NoteTree() {
  const [recentNotes] = createSignal([
    { id: 1, title: "Meeting Notes" },
    { id: 2, title: "Project Ideas" },
    { id: 3, title: "Shopping List" },
  ]);

  const RecentNotes = () => {
    return (
      <div class="mt-3 animate-fadeIn">
        <SubSectionHeader>Recent Notes</SubSectionHeader>
        <ul class="space-y-0.5 mt-1">
          {recentNotes().map((note, index) => (
            <AnimatedListItem index={index}>
              <NavLink href={`${ROUTES.NOTE_BASE_PATH}${note.id}`}>
                {note.title}
              </NavLink>
            </AnimatedListItem>
          ))}
        </ul>
      </div>
    );
  };

  const PinnedNotes = () => {
    return (
      <div class="mt-3 animate-fadeIn">
        <PinnedNotes />
      </div>
    );
  };

  return (
    <div class="p-2 overflow-y-auto h-full">
      <ServerNoteTree />

      <div class="mt-3">
        <SectionHeader>Collections</SectionHeader>
        <div class="space-y-1 mt-1">
          <NavLink href="/" end>
            All Notes
          </NavLink>
          <NavLink href="/favorites">Favorites</NavLink>
          <NavLink href="/trash">Trash</NavLink>
        </div>
      </div>
      {/*<RecentNotes />*/}
    </div>
  );
}
