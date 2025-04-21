import { Accessor, createResource, Resource, Suspense } from "solid-js";
import { Marked } from "marked";
import markedAlert from "marked-alert";
import markedFootnote from "marked-footnote";
import markedKatex from "marked-katex-extension";
import extendedTables from "marked-extended-tables";
import { markedHighlight } from "marked-highlight";
import { createDirectives } from "marked-directive";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css"; // Import highlight.js CSS

interface PreviewProps {
  content: Accessor<string> | Resource<string>;
  renderOnServer?: boolean;
}

// Configure marked converter (shared between client and server)
const configureMarked = () => {
  return new Marked()
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
    return await marked_converter.parse(source_content);
  } catch (error) {
    console.error("Error rendering markdown on client:", error);
    return `<p class="text-red-500">Error rendering content</p>`;
  }
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
    return await marked_converter.parse(source_content);
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

  const [html] = createResource(
    () =>
      typeof props.content === "function" ? props.content() : props.content,
    renderFunction,
  );

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
