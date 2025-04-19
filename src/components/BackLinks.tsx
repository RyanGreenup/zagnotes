import SectionHeader from "./SectionHeader";

/*
 * Ideally this would also sort backlinks by Graph Distance, e.g. PageRank -- Power Method
 * We could use semantic distance for a more interesting pageprank too.
 */
export default function Backlinks() {
  return (
    <div class="p-2">
      <SectionHeader>Backlinks</SectionHeader>
      <p class="text-xs mt-1" style={{ color: "var(--color-neutral)" }}>
        Notes that link to the current note will appear here.
      </p>
    </div>
  );
}
