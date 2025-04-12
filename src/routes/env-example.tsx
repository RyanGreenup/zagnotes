import { createResource, Show, Suspense } from "solid-js";

// Server function that fetches environment variables and time
async function fetchServerInfo() {
  "use server"; // This directive ensures the function runs on the server

  // Access environment variables (only available on the server)
  const dbPath = process.env.DB_PATH || "Not set";

  // Return both the environment variable and current time
  return {
    time: new Date().toISOString(),
    message: "Hello from the server!",
    dbPath: dbPath,
  };
}

export default function EnvExample() {
  // Use createResource with just the fetcher function
  // This will call fetchServerInfo immediately when the component mounts
  const [serverData, { refetch }] = createResource(fetchServerInfo);

  return (
    <div
      style={{
        padding: "1rem",
        border: "var(--border) solid var(--color-base-300)",
        "border-radius": "var(--radius-box)",
      }}
    >
      <h2
        style={{
          "font-size": "1.125rem",
          "font-weight": "600",
          "margin-bottom": "0.5rem",
        }}
      >
        Server Environment Example
      </h2>

      {/* Wrap the data display in Suspense to handle async state during hydration */}
      <Suspense fallback={<p>Loading server information...</p>}>
        {/* Show error state if there is one */}
        <Show when={serverData.error}>
          <p style={{ color: "var(--color-error)" }}>
            Error: {serverData.error.message}
          </p>
        </Show>

        {/* Show the data when it's available */}
        <Show when={serverData()}>
          <div
            style={{
              display: "flex",
              "flex-direction": "column",
              gap: "0.5rem",
            }}
          >
            <p>Server message: {serverData()?.message}</p>
            <p>Server time: {serverData()?.time}</p>
            <p style={{ "font-weight": "500" }}>
              DB_PATH:
              <span
                style={{
                  "font-family": "monospace",
                  "background-color": "var(--color-base-200)",
                  padding: "0.25rem 0.5rem",
                  "border-radius": "var(--radius-field)",
                }}
              >
                {serverData()?.dbPath}
              </span>
            </p>
          </div>
        </Show>
      </Suspense>

      {/* Button to manually refetch the data */}
      <button
        style={{
          "margin-top": "1rem",
          padding: "0.25rem 0.75rem",
          "background-color": "var(--color-primary)",
          color: "var(--color-primary-content)",
          "border-radius": "var(--radius-field)",
          transition: "background-color 0.2s ease",
        }}
        onClick={() => refetch()}
      >
        Refresh Server Info
      </button>
    </div>
  );
}
