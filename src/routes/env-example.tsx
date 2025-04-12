import { createSignal } from "solid-js";
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
  const [dbPathData, setDbPathData] = createSignal<{
    dbPath: string;
    timestamp: string;
  } | null>(null);
  const [loading, setLoading] = createSignal(false);

  const handleFetchDbPath = async () => {
    setLoading(true);
    try {
      const data = await getDbPath();
      setDbPathData(data);
    } catch (error) {
      console.error("Error fetching DB_PATH:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main class="p-8 max-w-3xl mx-auto">
      <h1
        class="text-2xl font-bold mb-6"
        style={{ color: "var(--color-primary)" }}
      >
        Environment Variables Example
      </h1>

      <div class="mb-6">
        <button
          onClick={handleFetchDbPath}
          disabled={loading()}
          class="btn px-4 py-2 rounded transition-all duration-200 disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-primary-content)",
            borderRadius: "var(--radius-field)",
          }}
        >
          {loading() ? "Loading..." : "Fetch DB_PATH"}
        </button>
      </div>

      {dbPathData() && (
        <div
          class="p-4 border animate-fadeIn"
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
            <span>{dbPathData().dbPath}</span>

            <span class="font-medium" style={{ color: "var(--color-accent)" }}>
              Timestamp:
            </span>
            <span>{dbPathData().timestamp}</span>
          </div>
        </div>
      )}

      <div class="mt-8 text-sm" style={{ color: "var(--color-neutral)" }}>
        <p>
          This example demonstrates using server functions to securely access
          environment variables.
        </p>
        <p class="mt-2">
          The DB_PATH is fetched on the server side only and cannot be accessed
          directly from the client.
        </p>
      </div>
    </main>
  );
}
