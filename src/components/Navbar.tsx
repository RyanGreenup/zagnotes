import { createSignal, JSX } from "solid-js";
import { A } from "@solidjs/router";
import { Menu, Search, MoreVertical, Users, FileEdit } from "lucide-solid";
import IconWrapper from "./IconWrapper";

// Add CSS for placeholder styling
const styles = `
  .search-input::placeholder {
    color: var(--color-neutral);
  }
`;

/**
 * SearchBar component for searching notes
 * This searches titles using a trigram search
 */
function SearchBar(props: {
  value: string;
  onInput: (e: InputEvent & { currentTarget: HTMLInputElement }) => void;
}) {
  return (
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <IconWrapper icon={Search} size="sm" color="var(--color-neutral)" />
      </div>
      <input
        type="text"
        placeholder="fzf notes..."
        class="block w-full pl-11 pr-3 py-2 leading-5 sm:text-sm search-input"
        style={{
          "background-color": "var(--color-base-200)",
          border: "var(--border) solid var(--color-base-300)",
          "border-radius": "var(--radius-field)",
          color: "var(--color-base-content)",
          padding: "var(--size-field)",
        }}
        value={props.value}
        onInput={props.onInput}
      />
    </div>
  );
}

/**
 * NavButton component for consistent button styling
 */
function NavButton(props: {
  onClick?: () => void;
  icon: (props: JSX.SvgSVGAttributes<SVGSVGElement>) => JSX.Element;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
  class?: string;
  rounded?: "md" | "full";
}) {
  const roundedClass = props.rounded === "full" ? "rounded-full" : "rounded-md";

  return (
    <button
      onClick={props.onClick}
      class={`p-2 focus:outline-none ${roundedClass} ${props.class || ""}`}
      style={{
        color: "var(--color-base-content)",
        "border-radius":
          props.rounded === "full"
            ? "var(--radius-selector)"
            : "var(--radius-field)",
      }}
      aria-label={props.ariaLabel}
    >
      <IconWrapper icon={props.icon} size={props.size || "lg"} />
    </button>
  );
}

/**
 * AppLogo component for the application logo
 */
function AppLogo() {
  return (
    <A href="/" class="flex items-center ml-2 md:ml-0">
      <IconWrapper icon={FileEdit} size="lg" color="var(--color-primary)" />
      <span
        class="ml-2 text-xl font-semibold"
        style={{ color: "var(--color-base-content)" }}
      >
        NoteKeeper
      </span>
    </A>
  );
}

/**
 * Navbar component for the Notetaking application
 * Includes app title, search, and mobile menu toggle
 * @param props Component properties
 * @returns Navbar component
 */
export default function Navbar(props: { toggleSidebar: () => void }) {
  const [searchQuery, setSearchQuery] = createSignal("");

  const handleSearchInput = (
    e: InputEvent & { currentTarget: HTMLInputElement },
  ) => {
    setSearchQuery(e.currentTarget.value);
  };

  return (
    <nav
      class="fixed w-full z-10"
      style={{
        "background-color": "var(--color-base-100)",
        "border-bottom": "var(--border) solid var(--color-base-300)",
      }}
    >
      <style>{styles}</style>
      <div class="px-4 py-3 flex items-center justify-between">
        {/* Left side - Logo and mobile menu button */}
        <div class="flex items-center">
          <NavButton
            onClick={props.toggleSidebar}
            icon={Menu}
            size="lg"
            rounded="md"
            ariaLabel="Toggle sidebar"
            class="md:hidden"
          />
          <AppLogo />
        </div>

        {/* Center - Search bar */}
        <div class="hidden md:block flex-1 max-w-md mx-4">
          <SearchBar value={searchQuery()} onInput={handleSearchInput} />
        </div>

        {/* Right side - User menu */}
        <div class="flex items-center">
          <NavButton icon={MoreVertical} rounded="full" />
          <NavButton icon={Users} rounded="full" class="ml-2" />
        </div>
      </div>

      {/* Mobile search bar */}
      <div class="px-4 py-2 md:hidden">
        <SearchBar value={searchQuery()} onInput={handleSearchInput} />
      </div>
    </nav>
  );
}
