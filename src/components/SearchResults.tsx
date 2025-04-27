import { createSignal, createEffect, Show, onMount } from "solid-js";
import { FileStack } from "lucide-solid";
import { useNavigate } from "@solidjs/router";
import AnimatedListItem from "./AnimatedListItem";
import NavLink from "./NavLink";
import type { SearchResult } from "~/lib/db-notes";
import { useKeyboardNavigation } from "~/lib/hooks/useKeyboardNavigation";

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  isActive?: boolean;
}

export default function SearchResults(props: SearchResultsProps) {
  const [selectedIndex, setSelectedIndex] = createSignal(-1);
  const [isFocused, setIsFocused] = createSignal(props.isActive || false);
  const navigate = useNavigate();
  const containerRef = { current: null as HTMLDivElement | null };
  
  // Reset selection when results change
  createEffect(() => {
    if (props.results.length > 0 && selectedIndex() === -1) {
      setSelectedIndex(0);
    } else if (props.results.length === 0) {
      setSelectedIndex(-1);
    }
  });
  
  // Handle navigation to note
  const handleSelectNote = (result: SearchResult) => {
    navigate(`/note/${result.id}`);
  };
  
  // Set up keyboard navigation
  const { navigateUp, navigateDown } = useKeyboardNavigation({
    items: () => props.results,
    selectedIndex,
    setSelectedIndex,
    onSelect: handleSelectNote,
    containerRef: containerRef.current,
    isActive: () => isFocused() && !props.isLoading && props.results.length > 0
  });
  
  // Handle container focus/blur
  onMount(() => {
    if (containerRef.current) {
      containerRef.current.addEventListener("focusin", () => setIsFocused(true));
      containerRef.current.addEventListener("focusout", () => setIsFocused(false));
    }
  });
  
  return (
    <div 
      class="mt-1" 
      ref={(el) => (containerRef.current = el)}
      tabIndex={0}
      data-scope="search-results"
    >
      <Show when={props.isLoading}>
        <p class="text-xs" style={{ color: "var(--color-neutral)" }}>
          Searching...
        </p>
      </Show>

      <Show when={!props.isLoading && props.results.length === 0}>
        <p class="text-xs" style={{ color: "var(--color-neutral)" }}>
          No results found
        </p>
      </Show>

      <Show when={!props.isLoading && props.results.length > 0}>
        <p class="text-xs mb-1" style={{ color: "var(--color-neutral)" }}>
          Use j/k to navigate, Enter to open
        </p>
        <ul class="space-y-0.5">
          {props.results.map((note, index) => (
            <AnimatedListItem index={index}>
              <div 
                class="flex items-center justify-between p-1 rounded"
                classList={{
                  "bg-[var(--color-base-300)] text-[var(--color-primary)]": selectedIndex() === index,
                  "hover:bg-[var(--color-base-200)]": selectedIndex() !== index
                }}
                onClick={() => {
                  setSelectedIndex(index);
                  handleSelectNote(note);
                }}
                data-focus={selectedIndex() === index ? "true" : undefined}
              >
                <div class="flex items-center">
                  <FileStack class="h-3 w-3 mr-1 text-accent" />
                  <span>{note.title}</span>
                </div>
                <span
                  class="text-xs text-neutral"
                  style={{ color: "var(--color-neutral)" }}
                >
                  {Math.round((1 / note.score) * 100)}%
                </span>
              </div>
            </AnimatedListItem>
          ))}
        </ul>
      </Show>
    </div>
  );
}