import { JSX, createSignal, createEffect, onMount, Show } from "solid-js";
import { useKeyboardNavigation } from "~/lib/hooks/useKeyboardNavigation";
import AnimatedListItem from "./AnimatedListItem";

export interface GenericListProps<T> {
  items: T[];
  isLoading?: boolean;
  isActive?: boolean;
  renderItem: (item: T, index: number, isSelected: boolean) => JSX.Element;
  onSelectItem?: (item: T) => void;
  emptyMessage?: string;
  loadingMessage?: string;
  helpText?: string;
}

export function GenericList<T>(props: GenericListProps<T>) {
  const [selectedIndex, setSelectedIndex] = createSignal(-1);
  const [isFocused, setIsFocused] = createSignal(props.isActive || false);
  const containerRef = { current: null as HTMLDivElement | null };
  
  // Reset selection when items change
  createEffect(() => {
    if (props.items.length > 0 && selectedIndex() === -1) {
      setSelectedIndex(0);
    } else if (props.items.length === 0) {
      setSelectedIndex(-1);
    }
  });
  
  // Handle item selection
  const handleSelectItem = (item: T) => {
    if (props.onSelectItem) {
      props.onSelectItem(item);
    }
  };
  
  // Set up keyboard navigation
  const { navigateUp, navigateDown } = useKeyboardNavigation({
    items: () => props.items,
    selectedIndex,
    setSelectedIndex,
    onSelect: handleSelectItem,
    containerRef: containerRef.current,
    isActive: () => isFocused() && !props.isLoading && props.items.length > 0
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
      data-scope="generic-list"
    >
      <Show when={props.isLoading}>
        <p class="text-xs" style={{ color: "var(--color-neutral)" }}>
          {props.loadingMessage || "Loading..."}
        </p>
      </Show>

      <Show when={!props.isLoading && props.items.length === 0}>
        <p class="text-xs" style={{ color: "var(--color-neutral)" }}>
          {props.emptyMessage || "No items found"}
        </p>
      </Show>

      <Show when={!props.isLoading && props.items.length > 0}>
        <Show when={props.helpText}>
          <p class="text-xs mb-1" style={{ color: "var(--color-neutral)" }}>
            {props.helpText}
          </p>
        </Show>
        <ul class="space-y-0.5">
          {props.items.map((item, index) => (
            <AnimatedListItem index={index}>
              <div 
                onClick={() => {
                  setSelectedIndex(index);
                  handleSelectItem(item);
                }}
                data-focus={selectedIndex() === index ? "true" : undefined}
              >
                {props.renderItem(item, index, selectedIndex() === index)}
              </div>
            </AnimatedListItem>
          ))}
        </ul>
      </Show>
    </div>
  );
}