import { APIEvent } from "solid-start/api";
import { getResourceFile } from "~/lib/db-resources";

export async function GET({ params }: APIEvent) {
  try {
    const resourceId = params.id;
    if (!resourceId) {
      return new Response("Resource ID is required", { status: 400 });
    }

    // Get the resource file
    const resource = await getResourceFile(resourceId);
    if (!resource) {
      return new Response("Resource not found", { status: 404 });
    }

    // Return the file with proper content type
    return new Response(resource.buffer, {
      headers: {
        "Content-Type": resource.mimeType,
        "Cache-Control": "public, max-age=86400"
      }
    });
  } catch (error) {
    console.error("Error serving resource:", error);
    return new Response("Internal server error", { status: 500 });
  }
}