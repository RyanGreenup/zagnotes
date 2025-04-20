/*
 * An example lifted from:
 *
 * https://blog.siposdani87.com/posts/create-rich-textarea-component-in-solid-js-with-ckeditor-5
 *
 * This example does not work and seems unstable, likely best to avoid CKEditor
 */

import "ckeditor5/ckeditor5.css";

import {
  type JSX,
  splitProps,
  Show,
  onMount,
  createEffect,
  createSignal,
} from "solid-js";

const ClassicEditor = () => import("@ckeditor/ckeditor5-build-classic");

type RichTextAreaFieldProps = {
  ref: (element: HTMLTextAreaElement) => void;
  name: string;
  value: string | undefined;
  onInput: JSX.EventHandler<HTMLTextAreaElement, InputEvent>;
  onChange: JSX.EventHandler<HTMLTextAreaElement, Event>;
  onBlur: JSX.EventHandler<HTMLTextAreaElement, FocusEvent>;
  placeholder?: string;
  required?: boolean;
  class?: string;
  label?: string;
  error?: string;
  rows?: number;
};

const editorConfig = {
  toolbar: {
    items: [
      "undo",
      "redo",
      "|",
      "heading",
      "|",
      "bold",
      "italic",
      "|",
      "bulletedList",
      "numberedList",
    ],
    shouldNotGroupWhenFull: false,
  },
};

export default function (props: RichTextAreaFieldProps) {
  const [, inputProps] = splitProps(props, [
    "class",
    "value",
    "label",
    "error",
  ]);

  const [value, setValue] = createSignal<string | undefined>(props.value);

  let editorDiv!: HTMLDivElement;
  let textareaRef!: HTMLTextAreaElement;
  let classicEditor: any;

  createEffect((prevValue) => {
    if (props.value && prevValue != props.value) {
      setValue(props.value);
    }
    return props.value;
  }, props.value);

  createEffect(() => {
    if (classicEditor?.getData() !== value()) {
      classicEditor?.setData(value());
    }
  });

  onMount(async () => {
    if (!import.meta.env.SSR) {
      ClassicEditor().then((ck) => {
        ck.default
          .create(editorDiv, editorConfig)
          .then((editor) => {
            classicEditor = editor;
            editor.model.document.on("change:data", () => {
              const data = editor.getData();
              setValue(data);
            });
          })
          .catch((error) => {
            console.error(error);
          });
      });
    }
  });

  const setRef = (ref: HTMLTextAreaElement) => {
    textareaRef = ref;
    props.ref(ref);
  };

  createEffect(() => {
    if (props.value !== value()) {
      textareaRef.dispatchEvent(
        new Event("input", { bubbles: true, cancelable: true }),
      );
    }
  });

  return (
    <div class={`form-control w-full ${props.class}`}>
      <div class="label">
        <span class="label-text">
          {props.label}
          <Show when={props.required}>
            <b class="ms-1 text-red-500">*</b>
          </Show>
        </span>
      </div>
      <div ref={editorDiv}></div>
      <textarea
        {...inputProps}
        required={props.required}
        value={value()}
        class="textarea textarea-bordered w-full hidden"
        ref={(ref) => setRef(ref)}
      ></textarea>
      <div class="label">
        <span class="label-text-alt text-error">{props.error}</span>
      </div>
    </div>
  );
}
