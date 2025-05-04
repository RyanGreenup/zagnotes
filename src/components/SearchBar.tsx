import { RefreshCw } from "lucide-solid";
import { Accessor, createSignal, mergeProps, Setter, Show } from "solid-js";
import type { SearchResult } from "~/lib/db/types/response";
import { searchNotes } from "~/lib/db/search/search";
import { semanticSearch } from "~/lib/db/embeddings/search";
import SearchChart from "./SearchChart";
import SearchInsights from "./SearchInsights";
import SearchResults from "./SearchResults";
import SectionHeader from "./SectionHeader";

type SearchMode = "sqlite" | "semantic";

interface SearchModeOption {
  id: SearchMode;
  label: string;
  description: string;
}

const SEARCH_MODES: SearchModeOption[] = [
  {
    id: "sqlite",
    label: "SQLite",
    description: "SQLite BM25 Search",
  },
  {
    id: "semantic",
    label: "Semantic",
    description: "Semantic search powered by Mixed Bread AI",
  },
];

interface SearchBarProps {
  showChart?: boolean;
}

async function handleRebuildIndex(
  callback: () => void,
  setIsLoading: Setter<boolean>,
) {
  try {
    setIsLoading(true);

    // Import the rebuildSemanticSearchIndex function
    const { rebuildSemanticSearchIndex } = await import("~/lib/db/embeddings/update");

    // Start the rebuild process
    const result = await rebuildSemanticSearchIndex();

    // Show the result to the user
    if (result.success) {
      alert(`Semantic search index rebuilt successfully!\n${result.message}`);
    } else {
      alert(`Semantic search index rebuild had issues.\n${result.message}`);
    }
  } catch (error) {
    console.error("Error rebuilding index:", error);
    alert(
      `Failed to rebuild semantic search index: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    setIsLoading(false);
    callback();
  }
}

export default function SearchBar(props: SearchBarProps = { showChart: true }) {
  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<SearchResult[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [searchMode, setSearchMode] = createSignal<SearchMode>("sqlite");
  const [debounceTimeout, setDebounceTimeout] = createSignal<
    number | undefined
  >(undefined);
  const mergedProps = mergeProps({ showChart: true }, props);

  const performSearch = async (
    searchQuery: string,
  ): Promise<SearchResult[]> => {
    const currentMode = searchMode();
    const limit = 50;

    if (currentMode === "sqlite") {
      // Standard SQLite search
      return await searchNotes(searchQuery, limit);
    } else if (currentMode === "semantic") {
      try {
        // Use semantic search with the query
        const results = await semanticSearch(searchQuery, limit);
        console.log(results);

        // If we got results, return them
        if (results && results.length > 0) {
          return results;
        } else {
          // If no semantic results, fall back to regular search
          console.log(
            "No semantic search results, falling back to standard search",
          );
          return await searchNotes(searchQuery, limit);
        }
      } catch (error) {
        console.error("Semantic search failed:", error);

        // // Fall back to regular search on error
        console.log("Using standard search results as fallback");
        return await searchNotes(searchQuery, limit);
      }
    }

    // Default fallback
    return await searchNotes(searchQuery, limit);
  };

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
          const searchResults = await performSearch(value);
          setResults(searchResults);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsLoading(false);
        }
      }, 300),
    );
  };

  // Re-run search when mode changes if we have an active query
  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);

    if (query().trim().length >= 2) {
      handleSearch(query());
    }
  };

  return (
    <div class="p-2">
      <SectionHeader>Search</SectionHeader>

      <div class="flex flex-col gap-2 mb-2">
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

        <SearchSelector
          searchMode={searchMode}
          searchModes={SEARCH_MODES}
          handleModeChange={handleModeChange}
          setIsLoading={setIsLoading}
        />
      </div>

      <SearchResults results={results()} isLoading={isLoading()} />

      <Show when={mergedProps.showChart}>
        <Show when={results().length > 0}>
          <SearchInsights results={results()} />
          <SearchChart results={results()} />{" "}
        </Show>
      </Show>
    </div>
  );
}

interface SearchTypeButtonProps {
  searchMode: Accessor<SearchMode>;
  mode: SearchModeOption;
  handleModeChange: (mode: SearchMode) => void;
}

interface SearchSelectorProps {
  searchModes: SearchModeOption[];
  searchMode: Accessor<SearchMode>;
  handleModeChange: (mode: SearchMode) => void;
  setIsLoading: Setter<boolean>;
}

function SearchSelector(props: SearchSelectorProps) {
  return (
    <div class="search-mode-selector flex justify-between items-center">
      <div class="search-toggle flex rounded-md overflow-hidden">
        {props.searchModes.map((mode) => (
          <SearchTypeButton
            searchMode={props.searchMode}
            mode={mode}
            handleModeChange={props.handleModeChange}
          />
        ))}
      </div>

      {/* Re-indexing button for semantic search */}
      <Show when={props.searchMode() === "semantic"}>
        <ReindexButton
          callback={() => {
            if (
              confirm(
                "Are you sure you want to rebuild the semantic search index? This may take some time. (It is recommended to use the Rust CLI instead)",
              )
            ) {
              handleRebuildIndex(() => {
                console.log("Rebuild index operation completed");
              }, props.setIsLoading);
            }
          }}
        />
      </Show>
    </div>
  );
}

function SearchTypeButton(props: SearchTypeButtonProps) {
  return (
    <button
      type="button"
      class="px-3 py-1 text-xs transition-colors"
      classList={{
        "bg-primary text-primary-content": props.searchMode() === props.mode.id,
        "bg-base-200 text-base-content hover:bg-base-300":
          props.searchMode() !== props.mode.id,
      }}
      onClick={() => props.handleModeChange(props.mode.id)}
      title={props.mode.description}
    >
      {props.mode.label}
    </button>
  );
}

interface ReindexButtonProps {
  callback: () => void;
}

function ReindexButton(props: ReindexButtonProps) {
  return (
    <button
      type="button"
      class="text-xs px-2 py-0.5 rounded-md bg-base-200 hover:bg-base-300 text-base-content flex items-center gap-1"
      title="Re-index the semantic search database"
      onClick={props.callback}
    >
      <RefreshCw class="w-3 h-3" />
      Rebuild
    </button>
  );
}
