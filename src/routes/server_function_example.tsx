import { createResource, Show } from "solid-js";

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
    <div class="p-4 border rounded-md">
      <h2 class="text-lg font-bold mb-2">Server Time Example</h2>

      {/* Show loading state */}
      <Show when={serverData.loading}>
        <p>Loading server time...</p>
      </Show>

      {/* Show error state if there is one */}
      <Show when={serverData.error}>
        <p class="text-red-500">Error: {serverData.error.message}</p>
      </Show>

      {/* Show the data when it's available */}
      <Show when={!serverData.loading && serverData()}>
        <div>
          <p>Server message: {serverData()?.message}</p>
          <p>Server time: {serverData()?.time}</p>
        </div>
      </Show>

      {/* Button to manually refetch the data */}
      <button
        class="mt-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => refetch()}
      >
        Refresh Server Time
      </button>
    </div>
  );
}
