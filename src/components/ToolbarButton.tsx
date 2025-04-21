import { JSX } from "solid-js";
import Button from "./Button";

/**
 * ToolbarButton component props
 */
interface ToolbarButtonProps {
  children: JSX.Element;
  onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>;
  class?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

/**
 * A specialized button component for toolbars with consistent styling
 */
export default function ToolbarButton(props: ToolbarButtonProps) {
  return (
    <Button
      onClick={props.onClick}
      variant="ghost"
      class={`h-8 min-h-0 px-2 ${props.class || ""}`}
      ariaLabel={props.ariaLabel}
      disabled={props.disabled}
    >
      {props.children}
    </Button>
  );
}
