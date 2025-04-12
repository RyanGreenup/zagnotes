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
  // Use createResource with an initialValue to prevent hydration mismatches
  const [dbPathData] = createResource(getDbPath, {
    initialValue: {
      dbPath: "Loading...",
      timestamp: "Loading..."
    }
  });

  return (
    <main class="p-8 max-w-3xl mx-auto">
      <h1
        class="text-2xl font-bold mb-6"
        style={{ color: "var(--color-primary)" }}
      >
        Environment Variables
      </h1>

      <div
        class="p-4 border"
        classList={{
          "animate-pulse": dbPathData.loading && !dbPathData.error,
          "animate-fadeIn": !dbPathData.loading && !dbPathData.error
        }}
        style={{
          backgroundColor: dbPathData.error 
            ? "var(--color-error-100)" 
            : "var(--color-base-200)",
          borderColor: dbPathData.error 
            ? "var(--color-error)" 
            : "var(--color-base-300)",
          borderWidth: "var(--border)",
          borderRadius: "var(--radius-box)",
        }}
      >
        <Show
          when={!dbPathData.error}
          fallback={
            <>
              <h2
                class="text-lg font-semibold mb-2"
                style={{ color: "var(--color-error)" }}
              >
                Error Loading Data
              </h2>
              <p>{dbPathData.error?.message || "An unknown error occurred"}</p>
            </>
          }
        >
          <h2
            class="text-lg font-semibold mb-2"
            style={{ color: "var(--color-secondary)" }}
          >
            Database Path Information
          </h2>
          <div class="grid grid-cols-[120px_1fr] gap-2">
            <span
              class="font-medium"
              style={{ color: "var(--color-accent)" }}
            >
              DB_PATH:
            </span>
            <span>{dbPathData()?.dbPath}</span>

            <span
              class="font-medium"
              style={{ color: "var(--color-accent)" }}
            >
              Timestamp:
            </span>
            <span>{dbPathData()?.timestamp}</span>
          </div>
        </Show>
      </div>

      <div class="mt-8 text-sm" style={{ color: "var(--color-neutral)" }}>
        <p>
          This component automatically fetches environment variables from the
          server.
        </p>
        <p class="mt-2">
          The DB_PATH is securely accessed on the server side and cannot be
          accessed directly from the client.
        </p>
      </div>
    </main>
  );
}
