import { createSignal, createEffect, Show } from "solid-js";
import SectionHeader from "./SectionHeader";
import SearchResults from "./SearchResults";
import SearchChart from "./SearchChart";
import SearchInsights from "./SearchInsights";
import { searchNotes } from "~/lib/db-notes";
import type { SearchResult } from "~/lib/db-notes";
import Card from "./Card";

export default function SearchBar() {
  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<SearchResult[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [debounceTimeout, setDebounceTimeout] = createSignal<
    number | undefined
  >(undefined);

  // Debounce search input to prevent excessive API calls
  const handleSearch = (value: string) => {
    setQuery(value);

    // Clear previous timeout
    if (debounceTimeout()) {
      clearTimeout(debounceTimeout());
    }

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    // Set new timeout
    setDebounceTimeout(
      window.setTimeout(async () => {
        try {
          const searchResults = await searchNotes(value, 50);
          setResults(searchResults);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsLoading(false);
        }
      }, 300),
    );
  };

  return (
    <div class="p-2">
      <SectionHeader>Search</SectionHeader>
      <div class="mt-2 rounded-md">
        <input
          type="text"
          placeholder="Search notes..."
          class="w-full p-1.5 text-sm bg-transparent focus:outline-none"
          style={{ color: "var(--color-base-content)" }}
          value={query()}
          onInput={(e) => handleSearch(e.currentTarget.value)}
        />
      </div>

      <SearchResults results={results()} isLoading={isLoading()} />

      <Show when={results().length > 0}>
        <SearchInsights results={results()} />

        <Card variant="bordered">
            <SearchChart results={results()} />{" "}
            </Card>
      </Show>
    </div>
  );
}
