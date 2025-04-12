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
    dbPath: dbPath
  };
}

export default function EnvExample() {
  // Use createResource with just the fetcher function
  // This will call fetchServerInfo immediately when the component mounts
  const [serverData, { refetch }] = createResource(fetchServerInfo);
  
  return (
    <div class="p-4 border rounded-md">
      <h2 class="text-lg font-bold mb-2">Server Environment Example</h2>
      
      {/* Wrap the data display in Suspense to handle async state during hydration */}
      <Suspense fallback={<p>Loading server information...</p>}>
        {/* Show error state if there is one */}
        <Show when={serverData.error}>
          <p class="text-red-500">Error: {serverData.error.message}</p>
        </Show>
        
        {/* Show the data when it's available */}
        <Show when={serverData()}>
          <div class="space-y-2">
            <p>Server message: {serverData()?.message}</p>
            <p>Server time: {serverData()?.time}</p>
            <p class="font-medium">DB_PATH: <span class="font-mono bg-gray-100 px-2 py-1 rounded">{serverData()?.dbPath}</span></p>
          </div>
        </Show>
      </Suspense>
      
      {/* Button to manually refetch the data */}
      <button 
        class="mt-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => refetch()}
      >
        Refresh Server Info
      </button>
    </div>
  );
}
