import { JSX } from "solid-js";

interface SubSectionHeaderProps {
  children: JSX.Element;
}

/**
 * Sub-section header component with consistent styling
 * @param props Component properties
 * @returns Styled sub-section header
 */
export default function SubSectionHeader(props: SubSectionHeaderProps) {
  return (
    <h3
      class="text-sm font-semibold uppercase tracking-wider mb-2 transition-all duration-300 hover:tracking-widest"
      style={{ color: "var(--color-neutral)" }}
    >
      {props.children}
    </h3>
  );
}
