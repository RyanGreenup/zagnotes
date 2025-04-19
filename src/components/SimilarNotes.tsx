import SectionHeader from "./SectionHeader";
import { createSignal, onMount } from "solid-js";
import AnimatedListItem from "./AnimatedListItem";
import { FileStack } from "lucide-solid";
import NavLink from "./NavLink";

export default function SimilarNotes() {
  const [similarNotes] = createSignal([
    { id: 201, title: "Related Research", similarity: 85 },
    { id: 202, title: "Similar Concept", similarity: 72 },
    { id: 203, title: "Connected Ideas", similarity: 68 },
  ]);

  return (
    <div class="p-2">
      <SectionHeader>Similar Notes</SectionHeader>
      <p class="text-xs mt-1" style={{ color: "var(--color-neutral)" }}>
        Notes with similar content to the current note.
      </p>
      <ul class="space-y-0.5 mt-2">
        {similarNotes().map((note, index) => (
          <AnimatedListItem index={index}>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <FileStack class="h-3 w-3 mr-1 text-accent" />
                <NavLink href={`/note/${note.id}`}>{note.title}</NavLink>
              </div>
              <span
                class="text-xs text-neutral"
                style={{ color: "var(--color-neutral)" }}
              >
                {note.similarity}%
              </span>
            </div>
          </AnimatedListItem>
        ))}
      </ul>
    </div>
  );
}
