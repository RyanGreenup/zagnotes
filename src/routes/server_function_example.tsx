import { createResource, Show, Suspense } from "solid-js";

// Simple async function that fetches data from the server
async function fetchServerTime() {
  // Simulate a server delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Return the current server time
  return {
    time: new Date().toISOString(),
    message: "Hello from the server!"
  };
}

export default function ServerTime() {
  // Use createResource with just the fetcher function
  // This will call fetchServerTime immediately when the component mounts
  const [serverData, { refetch }] = createResource(fetchServerTime);

  return (
    <div style={{
      padding: "1rem",
      border: "var(--border) solid var(--color-base-300)",
      "border-radius": "var(--radius-box)"
    }}>
      <h2 style={{
        "font-size": "1.125rem",
        "font-weight": "600",
        "margin-bottom": "0.5rem"
      }}>Server Time Example</h2>

      {/* Wrap the data display in Suspense to handle async state during hydration */}
      <Suspense fallback={<p>Loading server time...</p>}>
        {/* Show error state if there is one */}
        <Show when={serverData.error}>
          <p style={{ color: "var(--color-error)" }}>Error: {serverData.error.message}</p>
        </Show>
        
        {/* Show the data when it's available */}
        <Show when={serverData()}>
          <div>
            <p>Server message: {serverData()?.message}</p>
            <p>Server time: {serverData()?.time}</p>
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
        }}
        onClick={() => refetch()}
      >
        Refresh Server Time
      </button>
    </div>
  );
}
