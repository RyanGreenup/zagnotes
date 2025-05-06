import { createSignal, Show } from "solid-js";
import NavLink from "./NavLink";
import { Tabs, TabsValueChangeDetails } from "@ark-ui/solid/tabs";
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
  FileStack,
} from "lucide-solid";
import "./TabFocus.css";
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
  enum TabEnum {
    NOTE_TREE = "note_tree",
    BACKLINKS = "backlinks",
    FORWARDLINKS = "forwardlinks",
    SIMILAR = "similar",
    SEARCH = "search",
    RECENT = "recent",
  }

  const [activeTab, setActiveTab] = createSignal(TabEnum.NOTE_TREE);

  return (
    <aside class="h-full flex-shrink-0 flex flex-col relative">
      <Tabs.Root
        defaultValue={TabEnum.NOTE_TREE}
        class="flex flex-col h-full"
        onValueChange={(details: TabsValueChangeDetails) =>
          setActiveTab(details.value as TabEnum)
        }
      >
        {/* Tabs List */}
        <Tabs.List
          class="flex-shrink-0 sticky top-0 z-10 overflow-x-auto scrollbar-thin"
          style={{
            height: "var(--navbar-height)",
            "background-color": "var(--color-base-200)",
          }}
        >
          <Tabs.Trigger value={TabEnum.NOTE_TREE} title="Note Tree">
            <FolderTree />
            <span class="sr-only">Note Tree</span>
          </Tabs.Trigger>
          <Tabs.Trigger value={TabEnum.BACKLINKS} title="Backlinks">
            <Link2 />
            <span class="sr-only">Backlinks</span>
          </Tabs.Trigger>
          <Tabs.Trigger value={TabEnum.FORWARDLINKS} title="Forward Links">
            <ExternalLink />
            <span class="sr-only">Forward Links</span>
          </Tabs.Trigger>
          <Tabs.Trigger value={TabEnum.SIMILAR} title="Similar Notes">
            <FileStack />
            <span class="sr-only">Similar Notes</span>
          </Tabs.Trigger>
          <Tabs.Trigger value={TabEnum.SEARCH} title="Search">
            <Search />
            <span class="sr-only">Search</span>
          </Tabs.Trigger>
          <Tabs.Trigger value={TabEnum.RECENT} title="Recent Notes">
            <Clock />
            <span class="sr-only">Recent Notes</span>
          </Tabs.Trigger>
        </Tabs.List>

        {/* Tab Content */}
        <div
          class="flex-grow overflow-auto"
          style={{ height: "calc(100% - var(--navbar-height))" }}
        >
          <Tabs.Content value={TabEnum.NOTE_TREE} class="h-full">
            <Show when={activeTab() === TabEnum.NOTE_TREE}>
              <NoteTree />
            </Show>
          </Tabs.Content>
          <Tabs.Content value={TabEnum.BACKLINKS}>
            <Show when={activeTab() === TabEnum.BACKLINKS}>
              <Backlinks />
            </Show>
          </Tabs.Content>
          <Tabs.Content value={TabEnum.FORWARDLINKS}>
            <Show when={activeTab() === TabEnum.FORWARDLINKS}>
              <ForwardLinks />
            </Show>
          </Tabs.Content>
          <Tabs.Content value={TabEnum.SIMILAR}>
            <Show when={activeTab() === TabEnum.SIMILAR}>
              <SimilarNotes />
            </Show>
          </Tabs.Content>
          <Tabs.Content value={TabEnum.SEARCH}>
            {/* Always show the search bar otherwise the text and results will be lost*/}
            <Show when={true}>
              <SearchBar />
            </Show>
          </Tabs.Content>
          <Tabs.Content value={TabEnum.RECENT}>
            <Show when={activeTab() === TabEnum.RECENT}>
              <RecentNotes />
            </Show>
          </Tabs.Content>
        </div>
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
