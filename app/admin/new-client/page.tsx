import { EngagementForm } from "@/components/admin/EngagementForm";

export default function NewClientPage() {
  return (
    <main className="min-h-screen bg-[var(--color-cream)] py-12 px-4">
      <EngagementForm mode="create" />
    </main>
  );
}
