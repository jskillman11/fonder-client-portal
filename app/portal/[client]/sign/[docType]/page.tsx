import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { SigningSession } from "@/components/SigningSession";

export const dynamic = "force-dynamic";

export default async function SignDocumentPage({
  params,
}: {
  params: Promise<{ client: string; docType: string }>;
}) {
  const { client, docType } = await params;

  if (docType !== "sow" && docType !== "msa") {
    notFound();
  }

  const engagement = await getEngagement(client);
  if (!engagement) {
    notFound();
  }

  const markdown =
    docType === "sow" ? engagement.sowContentMarkdown : engagement.msaContentMarkdown;
  if (!markdown) {
    notFound();
  }

  const docLabel = docType === "sow" ? "Statement of Work" : "Master Services Agreement";

  return (
    <main className="min-h-screen bg-[var(--color-cream)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <SigningSession
          clientSlug={client}
          docType={docType}
          docLabel={docLabel}
          markdown={markdown}
        />
      </div>
    </main>
  );
}
