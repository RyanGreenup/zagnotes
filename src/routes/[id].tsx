import { useParams } from "@solidjs/router";
import Card from "~/components/Card";

/**
 * Dynamic ID route component
 * Displays the ID from the URL for debugging purposes
 * @returns Component that shows the ID in a card
 */
export default function DynamicIdPage() {
  const params = useParams();
  
  return (
    <main class="p-4">
      <Card 
        title="URL Parameter Debug"
        variant="bordered"
        padding="md"
      >
        <div class="flex flex-col">
          <p class="text-lg font-medium">ID Parameter:</p>
          <code class="bg-base-200 p-2 rounded mt-2 text-primary font-mono">
            {params.id}
          </code>
        </div>
      </Card>
    </main>
  );
}
