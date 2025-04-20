import { createSignal, JSX, createEffect, onMount, Show } from "solid-js";

interface NoteEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  class?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * A component that provides a textarea for editing note content
 * Uses clientOnly directive to prevent hydration mismatches
 */
export default function NoteEditor(props: NoteEditorProps) {
  const [content, setContent] = createSignal(props.initialContent || "");
  
  // This will only run on the client
  onMount(() => {
    // Set initial content after mount to ensure client-side rendering
    if (props.initialContent !== undefined) {
      setContent(props.initialContent);
    }
  });

  // Update content when initialContent prop changes
  createEffect(() => {
    if (props.initialContent !== undefined) {
      setContent(props.initialContent);
    }
  });

  const handleInput: JSX.EventHandler<HTMLTextAreaElement, InputEvent> = (event) => {
    const newContent = event.currentTarget.value;
    setContent(newContent);
    
    if (props.onContentChange) {
      props.onContentChange(newContent);
    }
  };

  // Use a static placeholder during SSR that will be replaced during hydration
  return (
    <div class={`note-editor ${props.class || ""}`}>
      <textarea
        value={content()}
        onInput={handleInput}
        placeholder={props.placeholder || "Start typing your note..."}
        disabled={props.disabled}
        class="w-full min-h-[200px] p-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
        style={{
          "background-color": "var(--color-base-200)",
          "color": "var(--color-base-content)",
          "border-color": "var(--color-base-300)",
          "resize": "vertical",
        }}
      />
    </div>
  );
}
