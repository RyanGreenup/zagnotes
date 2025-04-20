import { Accessor, Resource, Suspense } from "solid-js";
import { marked } from "marked";

interface previewProps {
    content: Accessor<string> | Resource<string>;
}

/**
 * Renders markdown content to HTML using marked.js
 */
function client_side_render(source_content: string): string {
    try {
        return marked(source_content);
    } catch (error) {
        console.error("Error rendering markdown:", error);
        return `<p class="text-red-500">Error rendering content</p>`;
    }
}

export default function(props: previewProps) {
    return (
        <div 
            class="markdown-preview prose max-w-none" 
            innerHTML={client_side_render(props.content() || "Unable to Get Content")}
        />
    );
}
