import SectionHeader from "./SectionHeader";


export default function RecentNotes() {
    return (
        <div class="p-2">
            <SectionHeader>Recent Notes</SectionHeader>
            <p
                class="text-xs text-neutral mt-1"
                style={{ color: "var(--color-neutral)" }}
            >
                Your recently accessed notes will appear here.
            </p>
        </div>
    );
}
