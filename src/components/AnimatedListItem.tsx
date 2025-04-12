import { JSX } from "solid-js";

interface AnimatedListItemProps {
  children: JSX.Element;
  index: number;
}

/**
 * Animated list item component with consistent styling and animation
 * @param props Component properties including index for staggered animation
 * @returns Styled and animated list item
 */
export default function AnimatedListItem(props: AnimatedListItemProps) {
  return (
    <li
      class="transform transition-all duration-300"
      style={{
        animation: `fadeSlideIn 0.5s ease-out ${props.index * 0.1 + 0.2}s both`,
      }}
    >
      {props.children}
    </li>
  );
}
