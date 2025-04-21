import { createEffect, onCleanup, onMount, Accessor, Setter } from "solid-js";
import { EditorState, Extension } from "@codemirror/state";
import {
  EditorView,
  keymap,
  highlightSpecialChars,
  drawSelection,
  lineNumbers,
  gutter,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  HighlightStyle,
  foldGutter,
} from "@codemirror/language";
import { vim } from "@replit/codemirror-vim";

import { tags } from "@lezer/highlight";
import { foldService, foldEffect } from "@codemirror/language";

interface CodeMirrorNoteEditorProps {
  /**
   * Accessor function that returns the current content
   */
  content: Accessor<string | undefined>;

  /**
   * Setter function to update the content
   */
  setContent: Setter<string>;

  /**
   * Additional CSS classes
   */
  class?: string;

  /**
   * Placeholder text when content is empty
   */
  placeholder?: string;

  /**
   * Whether the editor is disabled
   */
  disabled?: boolean;
}

/**
 * A CodeMirror 6 based note editor with markdown support
 */
export default function CodeMirrorNoteEditor(props: CodeMirrorNoteEditorProps) {
  let editorRef: HTMLDivElement | undefined;
  let editorView: EditorView | undefined;
  let isInitialized = false;

  // Custom markdown highlight style
  const markdownHighlightStyle = HighlightStyle.define([
    { tag: tags.heading1, fontSize: "1.6em", fontWeight: "bold" },
    { tag: tags.heading2, fontSize: "1.4em", fontWeight: "bold" },
    { tag: tags.heading3, fontSize: "1.2em", fontWeight: "bold" },
    { tag: tags.heading4, fontSize: "1.1em", fontWeight: "bold" },
    { tag: tags.heading5, fontSize: "1.05em", fontWeight: "bold" },
    { tag: tags.heading6, fontSize: "1em", fontWeight: "bold" },
    { tag: tags.strong, fontWeight: "bold", color: "var(--color-primary)" },
    {
      tag: tags.emphasis,
      fontStyle: "italic",
      color: "var(--color-secondary)",
    },
    { tag: tags.strikethrough, textDecoration: "line-through" },
    {
      tag: tags.link,
      color: "var(--color-primary)",
      textDecoration: "underline",
    },
    {
      tag: tags.url,
      color: "var(--color-primary)",
      textDecoration: "underline",
    },
    { tag: tags.quote, color: "var(--color-accent)", fontStyle: "italic" },
    { tag: tags.list, color: "var(--color-base-content)" },
    { tag: tags.content, color: "var(--color-base-content)" },
    {
      tag: tags.monospace,
      color: "#a3742c",
      backgroundColor: "rgba(0,0,0,0.05)",
    },
    { tag: tags.meta, color: "#404740" },
    { tag: tags.comment, color: "#506050", fontStyle: "italic" },
  ]);

  // Build the basic extensions
  const getExtensions = (): Extension[] => [
    vim(),
    highlightSpecialChars(),
    history(),
    drawSelection(),
    lineNumbers(),
    foldGutter(),
    EditorState.allowMultipleSelections.of(true),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
      addKeymap: true,
    }),
    // Apply both default and custom markdown highlighting
    syntaxHighlighting(defaultHighlightStyle),
    syntaxHighlighting(markdownHighlightStyle),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        // Only update when document content changes
        props.setContent(update.state.doc.toString());
      }
    }),
    EditorView.theme({
      "&": {
        height: "100%",
        fontSize: "var(--font-size-base)",
        lineHeight: "var(--line-height-base)",
      },
      ".cm-scroller": {
        fontFamily: "monospace",
        overflow: "auto",
        height: "100%",
      },
      ".cm-content": {
        caretColor: "var(--color-primary)",
        color: "var(--color-base-content)",
        padding: "1rem",
      },
      ".cm-line": {
        padding: "0",
      },
      ".cm-lineNumbers": {
        fontSize: "0.85rem",
        fontFamily: "monospace",
        paddingRight: "12px",
        backgroundColor: "var(--color-base-300)",
        color: "var(--color-base-content-secondary)",
      },
      ".cm-gutters": {
        backgroundColor: "var(--color-base-300)",
        color: "var(--color-base-content-secondary)",
        border: "none",
        borderRight: "1px solid var(--color-base-content-tertiary)",
      },
    }),
  ];

  // Initialize the editor with a delay to ensure the DOM is ready
  const initializeEditor = () => {
    if (!editorRef || isInitialized) return;

    // Ensure the element is fully attached to the DOM
    setTimeout(() => {
      try {
        // Create editor state
        const state = EditorState.create({
          doc: props.content() || "",
          extensions: getExtensions(),
        });

        // Create editor view
        editorView = new EditorView({
          state,
          parent: editorRef,
        });

        // Set the disabled state if needed
        if (props.disabled && editorView.contentDOM) {
          editorView.contentDOM.setAttribute("contenteditable", "false");
        }

        isInitialized = true;
      } catch (error) {
        console.error("Error initializing CodeMirror editor:", error);
      }
    }, 0);
  };

  // Create editor on mount
  onMount(() => {
    initializeEditor();
  });

  // Update editor content when props.content changes externally
  createEffect(() => {
    const currentContent = props.content() || "";

    if (
      editorView &&
      isInitialized &&
      editorView.state.doc.toString() !== currentContent
    ) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: currentContent,
        },
      });
    }
  });

  // Update disabled state when it changes
  createEffect(() => {
    if (editorView && isInitialized && editorView.contentDOM) {
      editorView.contentDOM.setAttribute(
        "contenteditable",
        props.disabled ? "false" : "true",
      );
    }
  });

  // Clean up the editor instance when component unmounts
  onCleanup(() => {
    if (editorView) {
      editorView.destroy();
      isInitialized = false;
    }
  });

  return (
    <div
      class={`codemirror-note-editor h-full ${props.class || ""}`}
      ref={editorRef}
      style={{
        "background-color": "var(--color-base-200)",
        height: "100%",
        width: "100%",
      }}
    />
  );
}
