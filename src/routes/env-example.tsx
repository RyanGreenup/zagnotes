import { createResource, Show } from "solid-js";
import { query } from "@solidjs/router";

// Server function to fetch the DB_PATH environment variable
const getDbPath = query(() => {
  "use server";
  return {
    dbPath: process.env.DB_PATH || "Not set",
    timestamp: new Date().toISOString(),
  };
}, "db-path");

export default function EnvExample() {
  // Use createResource with a simpler pattern to ensure loading works
  const [dbPathData] = createResource(async () => {
    return await getDbPath();
  }, {
    initialValue: null
  });

  return (
    <main class="p-8 max-w-3xl mx-auto">
      <h1
        class="text-2xl font-bold mb-6"
        style={{ color: "var(--color-primary)" }}
      >
        Environment Variables Example (Auto-Loading)
      </h1>

      <Show when={dbPathData.loading && !dbPathData()}>
        <div 
          class="inline-block px-4 py-2 rounded mb-6"
          style={{
            backgroundColor: "var(--color-base-200)",
            borderColor: "var(--color-base-300)",
            borderWidth: "var(--border)",
            borderRadius: "var(--radius-field)",
          }}
        >
          Loading environment variables...
        </div>
      </Show>

      <Show when={dbPathData.error}>
        <div
          class="p-4 border animate-fadeIn mb-6"
          style={{
            backgroundColor: "var(--color-error-100)",
            borderColor: "var(--color-error)",
            borderWidth: "var(--border)",
            borderRadius: "var(--radius-box)",
          }}
        >
          <h2
            class="text-lg font-semibold mb-2"
            style={{ color: "var(--color-error)" }}
          >
            Error Loading Data
          </h2>
          <p>An error occurred while fetching environment variables</p>
        </div>
      </Show>

      <Show when={dbPathData()}>
        {(data) => (
          <div
            class="p-4 border animate-fadeIn mb-6"
            style={{
              backgroundColor: "var(--color-base-200)",
              borderColor: "var(--color-base-300)",
              borderWidth: "var(--border)",
              borderRadius: "var(--radius-box)",
            }}
          >
            <h2
              class="text-lg font-semibold mb-2"
              style={{ color: "var(--color-secondary)" }}
            >
              Database Path Information
            </h2>
            <div class="grid grid-cols-[120px_1fr] gap-2">
              <span class="font-medium" style={{ color: "var(--color-accent)" }}>
                DB_PATH:
              </span>
              <span>{data.dbPath}</span>

              <span class="font-medium" style={{ color: "var(--color-accent)" }}>
                Timestamp:
              </span>
              <span>{data.timestamp}</span>
            </div>
          </div>
        )}
      </Show>

      <div class="mt-8 text-sm" style={{ color: "var(--color-neutral)" }}>
        <p>
          This example demonstrates using createResource to automatically fetch
          environment variables when the component loads.
        </p>
        <p class="mt-2">
          The DB_PATH is fetched on the server side only and cannot be accessed
          directly from the client.
        </p>
      </div>
    </main>
  );
}
