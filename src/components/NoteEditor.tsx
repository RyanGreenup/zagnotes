import { JSX, createEffect, Accessor, Setter } from "solid-js";

interface NoteEditorProps {
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
 * A fully reactive note editor component that works with Solid.js accessors and setters
 */
export default function NoteEditor(props: NoteEditorProps) {
  // Handle input changes
  const handleInput: JSX.EventHandler<HTMLTextAreaElement, InputEvent> = (
    event,
  ) => {
    const newContent = event.currentTarget.value;
    props.setContent(newContent);
  };

  /* Consider min-h-64 */
  return (
    <div class={`note-editor ${props.class || ""}`}>
      <textarea
        value={props.content() || ""}
        onInput={handleInput}
        placeholder={props.placeholder || "Start typing your note..."}
        disabled={props.disabled}
        class="w-full md:h-full md:min-h-screen  min-h-64  p-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
        style={{
          "background-color": "var(--color-base-200)",
          color: "var(--color-base-content)",
          "border-color": "var(--color-base-300)",
          resize: "vertical",
        }}
      />
    </div>
  );
}
