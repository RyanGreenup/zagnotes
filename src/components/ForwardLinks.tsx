import SectionHeader from "./SectionHeader";

export default function ForwardLinks() {
  return (
    <div class="p-2">
      <SectionHeader>Forward Links</SectionHeader>
      <p class="text-xs mt-1" style={{ color: "var(--color-neutral)" }}>
        Notes that are linked from the current note will appear here.
      </p>
    </div>
  );
}
