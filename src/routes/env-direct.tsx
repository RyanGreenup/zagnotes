import { createSignal } from "solid-js";

// Server function must be defined outside the component
const fetchEnvVars = async () => {
  "use server";

  // Get environment variables you want to expose
  return {
    NODE_ENV: process.env.NODE_ENV,
    APP_VERSION: process.env.APP_VERSION,
    PUBLIC_URL: process.env.PUBLIC_URL,
  };
};

export default function EnvDirect() {
  const [envData, setEnvData] = createSignal(null);

  const handleFetchEnv = async () => {
    const data = await fetchEnvVars();
    setEnvData(data);
  };

  return (
    <main class="p-8 max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">Environment Variables</h1>

      <button
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        onClick={handleFetchEnv}
      >
        Fetch Environment Variables
      </button>

      {envData() && (
        <div class="mt-6 bg-gray-100 p-4 rounded-lg">
          <h2 class="text-lg font-semibold mb-3">Environment Variables:</h2>
          <pre class="bg-gray-200 p-3 rounded overflow-auto">
            {JSON.stringify(envData(), null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}
