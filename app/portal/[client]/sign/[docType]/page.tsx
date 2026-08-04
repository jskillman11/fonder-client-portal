import { notFound } from "next/navigation";
import Link from "next/link";
import { getEngagement } from "@/lib/get-engagement";
import { hasPortalAccess } from "@/lib/supabase/server";
import { AccessGate } from "@/components/AccessGate";
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

  const { authorized } = await hasPortalAccess(client);

  if (!authorized) {
    return <AccessGate clientSlug={client} />;
  }

  const markdown =
    docType === "sow" ? engagement.sowContentMarkdown : engagement.msaContentMarkdown;
  if (!markdown) {
    notFound();
  }

  const docLabel = docType === "sow" ? "Statement of Work" : "Master Services Agreement";

  return (
    <main className="min-h-screen bg-[var(--color-cream)] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-3">
        <Link
          href={`/portal/${client}/app/home`}
          className="inline-block text-[13px] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          ← Back to portal
        </Link>
        <SigningSession
          clientSlug={client}
          docType={docType}
          docLabel={docLabel}
        />
      </div>
    </main>
  );
}
