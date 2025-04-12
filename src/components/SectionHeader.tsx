import { JSX } from "solid-js";

interface SectionHeaderProps {
  children: JSX.Element;
}

/**
 * Section header component with consistent styling
 * @param props Component properties
 * @returns Styled section header
 */
export default function SectionHeader(props: SectionHeaderProps) {
  return (
    <h2
      class="text-xl font-semibold mb-4 transition-all duration-300 transform hover:scale-105 origin-left"
      style={{ color: "var(--color-base-content)" }}
    >
      {props.children}
    </h2>
  );
}
