import { useParams } from "@solidjs/router";
import Card from "~/components/Card";
import { createResource } from "solid-js";

/**
 * Server function to get note body based on ID
 * @param id The note ID to retrieve
 * @returns A string representing the note body
 */
async function getNoteBody(id: string) {
  "use server";
  // This is a placeholder implementation
  // In the future, this would fetch actual note data from a database
  return `This is the default note body for ID: ${id}`;
}

/**
 * Dynamic ID route component
 * Displays the ID from the URL for debugging purposes
 * @returns Component that shows the ID in a card
 */
export default function DynamicIdPage() {
  const params = useParams();
  const [noteBody] = createResource(() => params.id, getNoteBody);

  return (
    <main class="p-4">
      <Card title="URL Parameter Debug" variant="bordered" padding="md">
        <p> This is root level URL</p>
        <div class="flex flex-col">
          <p class="text-lg font-medium">ID Parameter:</p>
          <code class="bg-base-200 p-2 rounded mt-2 text-primary font-mono">
            {params.id}
          </code>

          <p class="text-lg font-medium mt-4">Note Body:</p>
          <div class="bg-base-200 p-2 rounded mt-2">
            {noteBody.loading ? (
              <p class="text-neutral-500">Loading note content...</p>
            ) : (
              <p>{noteBody()}</p>
            )}
          </div>
        </div>
      </Card>
    </main>
  );
}
