import { createSignal, JSX, Show } from "solid-js";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

/**
 * Layout component for the Notetaking application
 * Handles responsive sidebar and main content layout
 * @param props Component properties with children
 * @returns Layout component
 */
export default function Layout(props: { children: JSX.Element }) {
  const [sidebarOpen, setSidebarOpen] = createSignal(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen());

  return (
    <div
      class="flex flex-col "
      style={{
        "background-color": "var(--color-base-100)",
        color: "var(--color-base-content)",
      }}
    >
      <Navbar toggleSidebar={toggleSidebar} />

      {/* Must be maybe 4 times the rem of --navbar height */}
      <div class="flex flex-1" style={{"padding-top": "var(--navbar-height)"}}>
        {/* Mobile sidebar overlay */}
        <Show when={sidebarOpen()}>
          <div
            class="fixed inset-0 z-20 backdrop-blur-sm md:hidden"
            style={{
              "background-color": "var(--color-base-200)",
              opacity: "0.7",
            }}
            onClick={() => setSidebarOpen(false)}
          />
        </Show>

        {/* Mobile sidebar */}
        <div
          class={`fixed z-30 inset-y-0 left-0 w-64 transition duration-300 transform md:hidden h-full ${
            sidebarOpen() ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{
            "background-color": "var(--color-base-200)",
            "border-right": "var(--border) solid var(--color-base-300)",
          }}
        >
          <Sidebar />
        </div>

        {/* Desktop sidebar */}
        <div
          class="hidden md:block h-screen fixed"
          style={{
            "background-color": "var(--color-base-200)",
            "border-right": "var(--border) solid var(--color-base-300)",
          }}
        >
          <Sidebar />
        </div>

        {/* Main content */}
        <div
          class="flex-1 overflow-auto md:ml-64"
          style={{ "background-color": "var(--color-base-100)" }}
        >
          <div class="container mx-auto p-4">{props.children}</div>
        </div>
      </div>
    </div>
  );
}
