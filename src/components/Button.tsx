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

  // Variant classes using CSS variables
  const variantClasses = {
    primary: "hover:opacity-90",
    secondary: "hover:opacity-90",
    neutral: "hover:opacity-90",
    accent: "hover:opacity-90",
    ghost: "bg-transparent hover:bg-opacity-10",
  };

  // Size classes
  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-3 py-1.5",
    lg: "px-4 py-2 text-lg",
  };

  // Rounded classes using CSS variables
  const roundedClasses = {
    sm: "",
    md: "",
    lg: "",
    full: "",
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
      style={{
        "background-color": variant !== "ghost" ? `var(--color-${variant})` : "transparent",
        "color": variant !== "ghost" ? `var(--color-${variant}-content)` : "var(--color-base-content)",
        "border-radius": rounded === "full" ? "9999px" : `var(--radius-${rounded})`,
      }}
      {...others}
    >
      {local.children}
    </button>
  );
}
