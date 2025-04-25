import { createSignal, JSX, Show, Suspense } from "solid-js";
import { A, useLocation, useParams, useSearchParams } from "@solidjs/router";
import {
  Menu,
  Search,
  MoreVertical,
  Users,
  FileEdit,
  Edit,
  NotebookIcon,
} from "lucide-solid";
import IconWrapper from "./IconWrapper";
import Button from "./Button";

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
      <div class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
        <IconWrapper icon={Search} size="sm" color="var(--color-neutral)" />
      </div>
      <input
        type="text"
        placeholder="Search notes..."
        class="block w-full pl-8 pr-2 py-1 leading-5 text-sm search-input"
        style={{
          "background-color": "var(--color-base-200)",
          border: "var(--border) solid var(--color-base-300)",
          "border-radius": "var(--radius-field)",
          color: "var(--color-base-content)",
          height: "calc(var(--navbar-height) * 0.6)",
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
      class={`p-1 focus:outline-none ${roundedClass} ${props.class || ""}`}
      style={{
        color: "var(--color-base-content)",
        "border-radius":
          props.rounded === "full"
            ? "var(--radius-selector)"
            : "var(--radius-field)",
      }}
      aria-label={props.ariaLabel}
    >
      <IconWrapper icon={props.icon} size={props.size || "md"} />
    </button>
  );
}

/**
 * AppLogo component for the application logo
 */
function AppLogo() {
  return (
    <A href="/" class="flex items-center ml-2 md:ml-0">
      <IconWrapper icon={FileEdit} size="md" color="var(--color-primary)" />
      <span
        class="ml-2 text-lg font-semibold"
        style={{ color: "var(--color-base-content)" }}
      >
        NoteKeeper
      </span>
    </A>
  );
}

function EditButton() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();

  const location = useLocation();

  const pathIsNote = () => {
    return location.pathname.startsWith("/note");
  };

  const EditButton = () => {
    return (
      <NavButton
        icon={Edit}
        onClick={() => setSearchParams({ edit: true })}
        size="md"
        rounded="full"
      />
    );
  };

  const PreviewButton = () => {
    return (
      <NavButton
        icon={NotebookIcon}
        onClick={() => setSearchParams({ edit: undefined })}
        size="md"
        rounded="full"
      />
    );
  };

  return (
    <Show when={pathIsNote() && params.id}>
      <Show when={searchParams.edit} fallback={<EditButton />}>
        <PreviewButton />
      </Show>
    </Show>
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
      {/* Desktop Navbar */}
      <div
        class="h-full flex items-center justify-between md:px-4"
        style={{
          height: "var(--navbar-height)",
          padding: "0 var(--navbar-padding-x)",
        }}
      >
        {/* Left side - Logo and mobile menu button */}
        <div class="flex items-center gap-1">
          <NavButton
            onClick={props.toggleSidebar}
            icon={Menu}
            size="md"
            rounded="md"
            ariaLabel="Toggle sidebar"
            class="md:hidden"
          />
          {/*
          <AppLogo />
          */}

          <EditButton />
        </div>

        {/* Center - Search bar (Desktop only) */}
        {/*
        <div class="hidden md:block flex-1 max-w-md mx-4">
          <SearchBar value={searchQuery()} onInput={handleSearchInput} />
        </div>
        */}

        {/* Right side - User menu */}
        <div class="flex items-center gap-1">
          <NavButton icon={MoreVertical} rounded="full" size="md" />
          <NavButton icon={Users} rounded="full" size="md" />
        </div>
      </div>

      {/* Mobile search bar */}
      {/*
      <div
        class="px-4 py-2 md:hidden"
        style={{
          "border-top": "var(--border) solid var(--color-base-300)",
        }}
      >
        <SearchBar value={searchQuery()} onInput={handleSearchInput} />
      </div>
      */}
    </nav>
  );

}
