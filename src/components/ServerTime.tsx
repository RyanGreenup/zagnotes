import { createResource, Show, Suspense } from "solid-js";
import Button from "~/components/Button";
import Card from "~/components/Card";
import SectionHeader from "./SectionHeader";

/**
 * Simple async function that fetches data from the server
 * @returns Server time, message, and environment variables
 */
async function fetchServerTime() {
  "use server";
  // Simulate a server delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Return the current server time and environment variables
  return {
    time: new Date().toISOString(),
    message: "Hello from the server!",
    dbPath: process.env.DB_PATH || "Not set",
  };
}

/**
 * Component that displays server time and allows refreshing
 * @returns ServerTime component
 */
export default function ServerTime() {
  // Use createResource with just the fetcher function
  // This will call fetchServerTime immediately when the component mounts
  const [serverData, { refetch }] = createResource(fetchServerTime);

  return (
    <Card variant="bordered" padding="md">
      <SectionHeader>Server Time Example</SectionHeader>

      {/* Wrap the data display in Suspense to handle async state during hydration */}
      <Suspense fallback={<p>Loading server time...</p>}>
        {/* Show error state if there is one */}
        <Show when={serverData.error}>
          <p style={{ color: "var(--color-error)" }}>
            Error: {serverData.error.message}
          </p>
        </Show>

        {/* Show the data when it's available */}
        <Show when={serverData()}>
          <div>
            <p>Server message: {serverData()?.message}</p>
            <p>
              Server time: <code>{serverData()?.time}</code>
            </p>
            <p>
              DB Path: <code>{serverData()?.dbPath}</code>
            </p>
          </div>
        </Show>
      </Suspense>

      {/* Button to manually refetch the data */}
      <Button variant="primary" class="mt-4" onClick={() => refetch()}>
        Refresh Server Time
      </Button>
    </Card>
  );
}
