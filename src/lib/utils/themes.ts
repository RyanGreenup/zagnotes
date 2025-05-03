/**
 * Module for theme management.
 *
 * NOTE: Current implementation doesn't correctly distinguish between
 * the `data-theme` attribute and `@media` prefers-color-scheme.
 *
 * TODO: Investigate daisyUI's approach for distinguishing dark/light themes
 * and general theme management as a potential model to follow.
 */

/**
 * Retrieves the current theme from sources in order of priority:
 * 1. localStorage "theme" value (user's explicit choice)
 * 2. HTML document's "data-theme" attribute
 * 3. Default fallback to "dark" when no preference is found
 *
 * Note: This function does not check @media (prefers-color-scheme)
 * which would be needed for automatic system preference detection.
 *
 * @returns {string} The current theme ('dark' or 'light')
 */
function getTheme(): string {
  // Get theme
  // Check local storage
  let theme = localStorage.getItem("theme");
  // Check the HTML attribute
  theme = theme || document.documentElement.getAttribute("data-theme");
  // If not, go with dark
  return theme || "dark";
}

/**
 * Toggles between light and dark themes.
 *
 * If the current theme is light or null, it sets the theme to dark.
 * If the current theme is dark, it sets the theme to light.
 * The change is applied to both localStorage and the document's data-theme attribute.
 */
export function toggleTheme() {
  let theme = getTheme();

  // Toggle
  if (theme === null || theme === "light") {
    theme = "dark";
  } else {
    theme = "light";
  }

  // Set theme
  setTheme(theme);
}

/**
 * Sets the theme for the application.
 *
 * This function updates both localStorage and the document's data-theme attribute
 * to ensure the theme persists across page loads and is visually applied.
 *
 * @param {string} theme - The theme to set ('dark' or 'light')
 */
function setTheme(theme: string) {
  localStorage.setItem("theme", theme);
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * Initializes the application theme.
 *
 * This function applies the user's preferred theme or the default theme
 * to the application by retrieving the theme and setting it as the active theme.
 * It should be called at application startup to ensure consistent theming.
 */
export function initTheme() {
  const theme = getTheme();
  setTheme(theme);
}
