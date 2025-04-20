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

interface previewProps {
  content: Accessor<string> | Resource<string>;
}

const marked_converter = new Marked()
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

/**
 * Renders markdown content to HTML using marked.js
 */
async function markdown_render(source_content: string): Promise<string> {
  try {
    // Ensure we properly await the parsing result
    return await marked_converter.parse(source_content);
  } catch (error) {
    console.error("Error rendering markdown:", error);
    return `<p class="text-red-500">Error rendering content</p>`;
  }
}

export default function (props: previewProps) {
  const [get_html, { mutate, refetch }] = createResource(
    props.content,
    markdown_render,
  );
  return (
    <div class="markdown-preview prose max-w-none" innerHTML={get_html()} />
  );
}
