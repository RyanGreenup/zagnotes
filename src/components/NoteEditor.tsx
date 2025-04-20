import { createSignal, JSX } from "solid-js";

interface NoteEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  class?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * A component that provides a textarea for editing note content
 */
export default function NoteEditor(props: NoteEditorProps) {
  const [content, setContent] = createSignal(props.initialContent || "");

  const handleInput: JSX.EventHandler<HTMLTextAreaElement, InputEvent> = (event) => {
    const newContent = event.currentTarget.value;
    setContent(newContent);

    if (props.onContentChange) {
      props.onContentChange(newContent);
    }
  };

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
