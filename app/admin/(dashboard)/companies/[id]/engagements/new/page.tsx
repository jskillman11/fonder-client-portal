import { notFound } from "next/navigation";
import { getCompany } from "@/lib/companies-clients";
import { EngagementForm } from "@/components/admin/EngagementForm";
import { BackButton } from "@/components/admin/BackButton";

export const dynamic = "force-dynamic";

export default async function NewEngagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto mb-3">
        <BackButton />
      </div>
      <EngagementForm
        lockedCompanyId={id}
        lockedCompanyName={company.name}
        backHref={`/admin/companies/${id}`}
      />
    </main>
  );
}
