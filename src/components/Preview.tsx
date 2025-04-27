import { Accessor, createEffect, createResource, createSignal, Resource, Suspense } from "solid-js";
import { Marked } from "marked";
import markedAlert from "marked-alert";
import markedFootnote from "marked-footnote";
import markedKatex from "marked-katex-extension";
import extendedTables from "marked-extended-tables";
import { markedHighlight } from "marked-highlight";
import { createDirectives } from "marked-directive";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css"; // Import highlight.js CSS
import { ROUTES } from "~/constants/routes";

interface PreviewProps {
  content: Accessor<string> | Resource<string>;
  renderOnServer?: boolean;
}

// Configure marked converter (shared between client and server)
const configureMarked = () => {
  const marked = new Marked();
  
  // Add custom extensions to handle the special link and image formats
  marked.use({
    extensions: [
      {
        name: 'noteLink',
        level: 'inline',
        // Only match markdown links that start with :/
        start(src) { 
          return src.match(/\[.*?\]\(\s*:\//)?.index;
        },
        tokenizer(src) {
          const rule = /^\[(.*?)\]\(\s*:\/([^\s\)]+)(?:\s+"([^"]+)")?\s*\)/;
          const match = rule.exec(src);
          if (match) {
            return {
              type: 'noteLink',
              raw: match[0],
              text: match[1],
              noteId: match[2],
              title: match[3]
            };
          }
          return undefined;
        },
        renderer(token) {
          const href = `/${ROUTES.NOTE_BASE_PATH}${token.noteId}`;
          const title = token.title ? ` title="${token.title}"` : '';
          return `<a href="${href}"${title}>${token.text}</a>`;
        }
      },
      {
        name: 'resourceImage',
        level: 'inline',
        // Match markdown images with either :/ prefix or without
        // DEVELOPMENT CHOICE: Support both formats like ![alt](:/id) and ![alt](id)
        start(src) {
          // Look for image markdown syntax
          const markdownImage = src.match(/!\[.*?\]\(\s*/)?.index;
          if (markdownImage === undefined) return undefined;
          
          // Check what follows the image prefix
          const afterPrefix = src.substring(markdownImage);
          
          // If it's an absolute URL with http/https, it's not a resource image
          if (afterPrefix.match(/!\[.*?\]\(\s*https?:\/\//)) {
            return undefined;
          }
          
          return markdownImage;
        },
        tokenizer(src) {
          // DEVELOPMENT CHOICE 1: Handle both formats with/without :/ prefix
          // DEVELOPMENT CHOICE 2: Handle IDs with/without file extension
          // Match formats:
          // - ![alt](:/id)
          // - ![alt](id)
          // - ![alt](:/id.ext)
          // - ![alt](id.ext)
          // where id is not a URL
          const rule = /^!\[(.*?)\]\(\s*(?::\/)?([a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)?)(?:\s+"([^"]+)")?\s*\)/;
          const match = rule.exec(src);
          
          if (match) {
            // Explicitly check that this isn't a URL (no http/https)
            const potentialId = match[2];
            if (potentialId.match(/^https?:\/\//)) {
              return undefined;
            }
            
            return {
              type: 'resourceImage',
              raw: match[0],
              text: match[1],
              resourceId: potentialId, // This could be with or without :/ prefix and with/without extension
              title: match[3]
            };
          }
          return undefined;
        },
        renderer(token) {
          // Construct the resource path relative to the API
          const resourcePath = `/api/resources/${token.resourceId}`;
          const alt = token.text || '';
          const title = token.title ? ` title="${token.title}"` : '';
          return `<img src="${resourcePath}" alt="${alt}"${title}>`;
        }
      }
    ]
  });
  
  return marked
    .use(markedAlert())
    .use(extendedTables())
    .use(
      markedHighlight({
        emptyLangClass: "hljs",
        langPrefix: "hljs language-",
        highlight(code, lang, info) {
          const language = hljs.getLanguage(lang) ? lang : "plaintext";
          return hljs.highlight(code, { language }).value;
        },
      }),
    )
    .use(markedFootnote())
    .use(createDirectives())
    .use(
      markedKatex({
        throwOnError: false,
      }),
    );
};

/**
 * Renders markdown content to HTML using marked.js on the client
 */
async function renderMarkdownClient(source_content: string): Promise<string> {
  try {
    const marked_converter = configureMarked();
    let html = await marked_converter.parse(source_content);
    
    // Process any direct HTML image tags with resource format
    html = processResourceImagesInHtml(html);
    
    return html;
  } catch (error) {
    console.error("Error rendering markdown on client:", error);
    return `<p class="text-red-500">Error rendering content</p>`;
  }
}

/**
 * Process HTML directly to handle resource image tags
 * This helps with content that might already be in HTML format
 */
function processResourceImagesInHtml(html: string): string {
  // DEVELOPMENT CHOICE 1: Handle both formats with/without :/ prefix
  // DEVELOPMENT CHOICE 2: Handle IDs with/without file extension
  // First, replace <img src=":/resourceId" ...> format, with optional file extension
  html = html.replace(
    /<img\s+[^>]*src=":\/([\w\d]+(?:\.[a-zA-Z0-9]+)?)"[^>]*>/g, 
    (match, resourceId) => {
      // Extract the alt attribute if it exists
      const altMatch = match.match(/alt="([^"]*)"/);
      const alt = altMatch ? altMatch[1] : '';
      
      // Create the new img tag with the API path
      return `<img src="/api/resources/${resourceId}" alt="${alt}">`;
    }
  );
  
  // DEVELOPMENT CHOICE 2: Handle IDs with or without file extension
  // This regex matches resource IDs with optional file extensions
  // It excludes URLs with http/https and already processed /api/resources/ paths
  html = html.replace(
    /<img\s+[^>]*src="([\w\d]+(?:\.[a-zA-Z0-9]+)?)"[^>]*>/g,
    (match, potentialId) => {
      // Skip if this looks like a URL or already processed path
      if (potentialId.match(/^(https?:\/\/|\/api\/resources\/)/)) {
        return match; // Return unchanged if it's a URL or already processed
      }
      
      // Extract the alt attribute if it exists
      const altMatch = match.match(/alt="([^"]*)"/);
      const alt = altMatch ? altMatch[1] : '';
      
      // Create the new img tag with the API path
      return `<img src="/api/resources/${potentialId}" alt="${alt}">`;
    }
  );
  
  return html;
}

/**
 * Renders markdown content to HTML using marked.js on the server
 */
async function renderMarkdownServer(source_content: string): Promise<string> {
  "use server";
  try {
    // NOTE this is handy to simulate SSR
    // TODO Remove this eventually, this stops as accidently using SSR for live preview
    // await new Promise(resolve => setTimeout(resolve, 500));

    const marked_converter = configureMarked();
    let html = await marked_converter.parse(source_content);
    
    // Process any direct HTML image tags with resource format
    html = processResourceImagesInHtml(html);
    
    return html;
  } catch (error) {
    console.error("Error rendering markdown on server:", error);
    return `<p class="text-red-500">Error rendering content on server</p>`;
  }
}

export default function Preview(props: PreviewProps) {
  // Choose the appropriate rendering function based on the prop
  const renderFunction = props.renderOnServer
    ? renderMarkdownServer
    : renderMarkdownClient;

  // Create a debounced signal to avoid frequent re-renders
  const [debouncedContent, setDebouncedContent] = createSignal<string>("");
  let debounceTimeout: number | undefined;
  
  // Set up debounce effect for content updates
  createEffect(() => {
    const currentContent = typeof props.content === "function" 
      ? props.content() 
      : props.content;
    
    // Clear previous timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    // Set a new timeout
    debounceTimeout = window.setTimeout(() => {
      setDebouncedContent(currentContent);
    }, 300); // 300ms debounce delay
  });

  // Create resource with debounced content
  const [html] = createResource(debouncedContent, renderFunction);

  return (
    <div
      class="markdown-preview prose max-w-none h-full overflow-auto p-4 rounded-md bg-base-100 shadow-sm"
      style={{
        "font-size": "var(--font-size-base)",
        "line-height": "var(--line-height-base)",
      }}
      innerHTML={html()}
    />
  );
}
