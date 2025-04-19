import SectionHeader from "./SectionHeader";

export default function SearchBar() {
  return (
    <div class="p-2">
      <SectionHeader>Search</SectionHeader>
      <div class="mt-2 rounded-md">
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
