import { JSX, splitProps } from "solid-js";

/**
 * Button variant types
 */
type ButtonVariant = "primary" | "secondary" | "neutral" | "accent" | "ghost";

/**
 * Button size types
 */
type ButtonSize = "sm" | "md" | "lg";

/**
 * Button component props
 */
interface ButtonProps {
  children: JSX.Element;
  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: "sm" | "md" | "lg" | "full";
  class?: string;
  onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * Reusable Button component with various styling options
 * @param props Button properties
 * @returns Button component
 */
export default function Button(props: ButtonProps) {
  const [local, others] = splitProps(props, [
    "children",
    "variant",
    "size",
    "rounded",
    "class",
    "onClick",
    "type",
    "disabled",
    "ariaLabel",
  ]);

  // Variant classes
  const variantClasses = {
    primary: "bg-primary text-primary-content hover:bg-primary-focus",
    secondary: "bg-secondary text-secondary-content hover:bg-secondary-focus",
    neutral: "bg-neutral text-neutral-content hover:bg-neutral-focus",
    accent: "bg-accent text-accent-content hover:bg-accent-focus",
    ghost: "bg-transparent hover:bg-base-200 text-base-content",
  };

  // Size classes
  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-3 py-1.5",
    lg: "px-4 py-2 text-lg",
  };

  // Rounded classes
  const roundedClasses = {
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  // Default values
  const variant = local.variant || "primary";
  const size = local.size || "md";
  const rounded = local.rounded || "md";
  const type = local.type || "button";

  // Combine all classes
  const buttonClass = [
    "font-medium transition-all duration-200 transform",
    "focus:outline-none focus:ring-2 focus:ring-opacity-50",
    "disabled:opacity-60 disabled:cursor-not-allowed",
    variantClasses[variant],
    sizeClasses[size],
    roundedClasses[rounded],
    local.class || "",
  ].join(" ");

  return (
    <button
      class={buttonClass}
      onClick={local.onClick}
      type={type}
      disabled={local.disabled}
      aria-label={local.ariaLabel}
      {...others}
    >
      {local.children}
    </button>
  );
}
