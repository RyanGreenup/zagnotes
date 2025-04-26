import { ChevronRight } from "lucide-solid";

interface RotatingChevronProps {
  isExpanded: () => boolean;
}
export default function RotatingChevronIcon(props: RotatingChevronProps) {
  return (
    <span
      class="mr-1 inline-flex justify-center items-center w-4 h-4 transition-transform duration-150"
      style={{
        transform: props.isExpanded() ? "rotate(90deg)" : "rotate(0deg)",
      }}
      data-part="branch-indicator"
    >
      <ChevronRight class="w-4 h-4" />
    </span>
  );
}
