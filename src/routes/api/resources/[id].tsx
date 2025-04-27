import { APIEvent } from "solid-start/api";
import { getResourceFile } from "~/lib/db-resources";

/**
 * Serve resource files with optimized caching
 *
 * FUTURE IMPROVEMENTS:
 * 1. Add proper ETag and Last-Modified headers for HTTP caching
 * 2. Implement image resizing based on query parameters (width, height)
 * 3. Add support for image format conversion (e.g., WebP for modern browsers)
 * 4. Support range requests for partial content delivery
 */
export async function GET({ params, request }: APIEvent) {
  try {
    const resourceId = params.id;
    if (!resourceId) {
      return new Response("Resource ID is required", { status: 400 });
    }

    // OPTIMIZATION: Check If-None-Match header for client-side caching
    const etag = `"${resourceId}"`; // Simple ETag based on the resource ID
    const ifNoneMatch = request.headers.get("If-None-Match");

    if (ifNoneMatch === etag) {
      // Return 304 Not Modified if the client already has the resource
      return new Response(null, {
        status: 304,
        headers: {
          "ETag": etag,
          "Cache-Control": "public, max-age=31536000" // 1 year
        }
      });
    }

    // Get the resource file
    const resource = await getResourceFile(resourceId);
    if (!resource) {
      return new Response("Resource not found", { status: 404 });
    }

    // OPTIMIZATION: Aggressive caching for resources
    // Resources are immutable since their ID is in the URL
    return new Response(resource.buffer, {
      headers: {
        "Content-Type": resource.mimeType,
        "Cache-Control": "public, max-age=86400, immutable", // 1 day
        "ETag": etag,
        "Content-Length": resource.buffer.length.toString()
      }
    });
  } catch (error) {
    console.error("Error serving resource:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
