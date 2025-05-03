const SIDEBAR_STATE_LS_KEY = "sidebar_open";

export function initSidebarState(sidebarSetter: (value: boolean) => void) {
  // Get stored value from localStorage
  const storedState = localStorage.getItem(SIDEBAR_STATE_LS_KEY);

  // Only update state if we have a valid stored value
  if (storedState !== null) {
    try {
      const parsedState = JSON.parse(storedState);
      // Make sure we're dealing with a boolean
      if (typeof parsedState === "boolean") {
        sidebarSetter(parsedState);
      }
    } catch (e) {
      // Handle invalid JSON gracefully
      console.error("Invalid sidebar state in localStorage:", e);
    }
  }
}

export function setSidebarState(sidebarGetter: () => Boolean) {
  // Get current state
  const currentState = sidebarGetter();

  // Store it in localStorage
  localStorage.setItem(SIDEBAR_STATE_LS_KEY, JSON.stringify(currentState));
}
