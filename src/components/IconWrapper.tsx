import { JSX } from "solid-js";

interface IconWrapperProps {
  icon: (props: JSX.SvgSVGAttributes<SVGSVGElement>) => JSX.Element;
  size?: "sm" | "md" | "lg";
  color?: string;
  class?: string;
}

/**
 * Wrapper component for icons to ensure consistent styling
 * @param props Component properties
 * @returns IconWrapper component
 */
export default function IconWrapper(props: IconWrapperProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const sizeClass = sizeClasses[props.size || "md"];

  return (
    <props.icon
      class={`${sizeClass} ${props.class || ""}`}
      style={{ color: props.color || "currentColor" }}
    />
  );
}
