import { JSX, splitProps } from "solid-js";

interface CardProps {
  children: JSX.Element;
  title?: JSX.Element;
  subtitle?: JSX.Element;
  footer?: JSX.Element;
  class?: string;
  variant?: "default" | "bordered" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent>;
}

export default function Card(props: CardProps) {
  const [local, others] = splitProps(props, [
    "children",
    "title",
    "subtitle",
    "footer",
    "class",
    "variant",
    "padding",
    "onClick",
  ]);

  const variant = local.variant || "default";
  const padding = local.padding || "md";

  // Padding classes
  const paddingClasses = {
    none: "p-0",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
  };

  // Combine all classes
  const cardClass = `
    transition-all duration-200
    ${paddingClasses[padding]}
    ${local.class || ""}
  `;

  // Variant styles using CSS variables
  const variantStyles = {
    default: {
      backgroundColor: "var(--color-base-100)",
      border: "none",
      boxShadow: "none",
    },
    bordered: {
      backgroundColor: "var(--color-base-100)",
      border: "var(--border) solid var(--color-base-300)",
      boxShadow: "none",
    },
    elevated: {
      backgroundColor: "var(--color-base-100)",
      border: "none",
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
  };

  return (
    <div
      class={cardClass}
      onClick={local.onClick}
      style={{
        "background-color": variantStyles[variant].backgroundColor,
        border: variantStyles[variant].border,
        "box-shadow": variantStyles[variant].boxShadow,
        "border-radius": "var(--radius-box)",
        color: "var(--color-base-content)",
      }}
      {...others}
    >
      {local.title && (
        <div class="mb-2">
          <h3 class="text-lg font-semibold">{local.title}</h3>
          {local.subtitle && <p class="text-sm opacity-70">{local.subtitle}</p>}
        </div>
      )}

      <div>{local.children}</div>

      {local.footer && (
        <div
          class="mt-4 pt-3 border-t"
          style={{ "border-color": "var(--color-base-300)" }}
        >
          {local.footer}
        </div>
      )}
    </div>
  );
}
