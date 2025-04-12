import { JSX } from "solid-js";
import { A } from "@solidjs/router";

interface NavLinkProps {
  href: string;
  children: JSX.Element;
  end?: boolean;
}

/**
 * Navigation link component with consistent styling
 * @param props Component properties
 * @returns Styled navigation link
 */
export default function NavLink(props: NavLinkProps) {
  return (
    <A
      href={props.href}
      class="block p-2 rounded font-medium transition-all duration-200 transform hover:translate-x-2 hover:bg-opacity-80 hover:shadow-md"
      style={{
        color: "var(--color-base-content)",
        "border-radius": "var(--radius-field)",
      }}
      activeClass="active-link"
      end={props.end}
    >
      {props.children}
    </A>
  );
}
