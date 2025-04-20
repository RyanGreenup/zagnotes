import { Accessor, Resource, Suspense } from "solid-js";

interface previewProps {
    content: Accessor<string> | Resource<string>;
}


function client_side_render(source_content: string): string {
    return "Rendered!: " + source_content;
}

export default function(props: previewProps) {
    return (
        <p>{client_side_render(props.content() || "Unable to Get Content")}</p>
    );
}
