import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { createServiceClient } from "@/lib/supabase/server";
import { EngagementForm } from "@/components/admin/EngagementForm";

export const dynamic = "force-dynamic";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const engagement = await getEngagement(slug);

  if (!engagement) {
    notFound();
  }

  // Pull transcript/notes too -- getEngagement() doesn't return these since
  // the public portal page never needs them; the edit form does.
  const supabase = createServiceClient();
  const { data: raw } = await supabase
    .from("engagements")
    .select("transcript, notes")
    .eq("client_slug", slug)
    .single();

  return (
    <main className="min-h-screen bg-[var(--color-cream)] py-12 px-4">
      <EngagementForm
        mode="edit"
        existingLogoUrl={engagement.clientLogoUrl}
        initialValues={{
          clientSlug: engagement.clientSlug,
          clientName: engagement.clientName,
          engagementTitle: engagement.engagementTitle,
          totalFee: engagement.totalFee,
          finalDeliveryDate: engagement.finalDeliveryDate,
          clientSignatoryName: engagement.clientSignatoryName,
          clientSignatoryEmail: engagement.clientSignatoryEmail,
          transcript: raw?.transcript ?? "",
          notes: raw?.notes ?? "",
          sowContentMarkdown: engagement.sowContentMarkdown ?? "",
          msaContentMarkdown: engagement.msaContentMarkdown ?? "",
          team: engagement.team.map((m) => ({
            name: m.name,
            role: m.role,
            blurb: m.blurb ?? "",
          })),
        }}
      />
    </main>
  );
}
