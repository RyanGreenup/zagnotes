"use client";

import { Accessor, Setter, createEffect, onCleanup, onMount } from "solid-js";

export interface KeyboardNavigationOptions<T> {
  /**
   * Array of items that can be navigated
   */
  items: Accessor<T[]>;
  
  /**
   * Current selected index
   */
  selectedIndex: Accessor<number>;
  
  /**
   * Function to set the selected index
   */
  setSelectedIndex: Setter<number>;
  
  /**
   * Optional callback when an item is selected (e.g., via Enter key)
   */
  onSelect?: (item: T, index: number) => void;
  
  /**
   * Element that should receive keyboard events (defaults to document)
   */
  containerRef?: HTMLElement | null;
  
  /**
   * Optional condition to determine if keyboard navigation is active
   */
  isActive?: Accessor<boolean>;
  
  /**
   * Keys that move the selection up/down (defaults to ArrowUp/ArrowDown and k/j)
   */
  navigationKeys?: {
    up: string[];
    down: string[];
    select: string[];
  };
  
  /**
   * Whether to wrap around at the beginning/end of the list
   */
  wrapAround?: boolean;
}

/**
 * Hook for keyboard navigation in lists, providing j/k keybindings with vim-like navigation
 */
export function useKeyboardNavigation<T>({
  items,
  selectedIndex,
  setSelectedIndex,
  onSelect,
  containerRef = null,
  isActive = () => true,
  navigationKeys = {
    up: ["ArrowUp", "k"],
    down: ["ArrowDown", "j"],
    select: ["Enter", " "]
  },
  wrapAround = false
}: KeyboardNavigationOptions<T>) {
  // Handler for keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    // Only handle events when active
    if (!isActive()) return;
    
    // Check if the key matches any navigation keys
    if (navigationKeys.up.includes(e.key)) {
      e.preventDefault();
      navigateUp();
    } else if (navigationKeys.down.includes(e.key)) {
      e.preventDefault();
      navigateDown();
    } else if (navigationKeys.select.includes(e.key) && onSelect) {
      e.preventDefault();
      const currentItems = items();
      const index = selectedIndex();
      if (index >= 0 && index < currentItems.length) {
        onSelect(currentItems[index], index);
      }
    }
  };
  
  // Navigate to previous item
  const navigateUp = () => {
    const currentItems = items();
    if (currentItems.length === 0) return;
    
    setSelectedIndex(prev => {
      if (prev <= 0) {
        return wrapAround ? currentItems.length - 1 : 0;
      }
      return prev - 1;
    });
  };
  
  // Navigate to next item
  const navigateDown = () => {
    const currentItems = items();
    if (currentItems.length === 0) return;
    
    setSelectedIndex(prev => {
      if (prev >= currentItems.length - 1) {
        return wrapAround ? 0 : currentItems.length - 1;
      }
      return prev + 1;
    });
  };
  
  // Effect to attach keyboard listeners
  onMount(() => {
    const targetElement = containerRef || document;
    targetElement.addEventListener('keydown', handleKeyDown);
    
    onCleanup(() => {
      targetElement.removeEventListener('keydown', handleKeyDown);
    });
  });
  
  // Reset selected index if items change
  createEffect(() => {
    const currentItems = items();
    if (currentItems.length > 0 && selectedIndex() >= currentItems.length) {
      setSelectedIndex(0);
    }
  });
  
  // Return navigation functions for external use
  return {
    navigateUp,
    navigateDown,
    handleKeyDown
  };
}