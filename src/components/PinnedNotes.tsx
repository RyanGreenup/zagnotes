import { createSignal, onMount } from "solid-js";
import SubSectionHeader from "./SubSectionHeader";
import AnimatedListItem from "./AnimatedListItem";
import { Pin } from "lucide-solid";
import NavLink from "./NavLink";

export default function PinnedNotes() {
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
