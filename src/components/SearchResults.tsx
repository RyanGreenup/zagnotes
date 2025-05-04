import { FileStack } from "lucide-solid";
import { useNavigate } from "@solidjs/router";
import type { SearchResult } from "~/lib/db/types/response";
import { GenericList } from "./GenericList";
import { calculateRelevancePercentage } from "~/lib/chart-utils";

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  isActive?: boolean;
}

export default function SearchResults(props: SearchResultsProps) {
  const navigate = useNavigate();

  // Handle navigation to note
  const handleSelectNote = (result: SearchResult) => {
    navigate(`/note/${result.id}`);
  };

  // Render item function for generic list
  const renderSearchResult = (
    note: SearchResult,
    index: number,
    isSelected: boolean,
  ) => {
    return (
      <div
        class="flex items-center justify-between p-1 rounded"
        classList={{
          "bg-[var(--color-base-300)] text-[var(--color-primary)]": isSelected,
          "hover:bg-[var(--color-base-200)]": !isSelected,
        }}
      >
        <div class="flex items-center">
          <FileStack class="h-3 w-3 mr-1 text-accent" />
          <span>{note.title}</span>
        </div>
        <span
          class="text-xs text-neutral"
          style={{ color: "var(--color-neutral)" }}
        >
          {calculateRelevancePercentage(note.score)}%
        </span>
      </div>
    );
  };

  return (
    <GenericList
      items={props.results}
      isLoading={props.isLoading}
      isActive={props.isActive}
      renderItem={renderSearchResult}
      onSelectItem={handleSelectNote}
      emptyMessage="No results found"
      loadingMessage="Searching..."
      helpText="Use j/k to navigate, Enter to open"
    />
  );
}
