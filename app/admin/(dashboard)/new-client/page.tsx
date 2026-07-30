import { EngagementForm } from "@/components/admin/EngagementForm";
import { BackButton } from "@/components/admin/BackButton";

export default function NewClientPage() {
  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto mb-3">
        <BackButton />
      </div>
      <EngagementForm mode="create" />
    </main>
  );
}
