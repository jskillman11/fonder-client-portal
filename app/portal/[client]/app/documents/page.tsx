import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { Card } from "@/components/Card";
import { PlaceholderTab } from "@/components/portal-app/PlaceholderTab";

export const dynamic = "force-dynamic";

function DocumentRow({
  label,
  signed,
  documentPath,
  downloadHref,
}: {
  label: string;
  signed: boolean;
  documentPath: string | null;
  downloadHref: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-[14px] border border-[var(--color-border)] px-5 py-4">
      <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">{label}</p>
      {documentPath ? (
        <a
          href={downloadHref}
          className="rounded-[var(--radius-pill)] bg-[var(--color-ink)] text-white text-[13px] font-semibold px-5 py-2.5 whitespace-nowrap ml-4 hover:opacity-90"
        >
          Download
        </a>
      ) : signed ? (
        <span className="text-[12px] text-[var(--color-faint)] whitespace-nowrap ml-4">
          Signed — awaiting countersignature
        </span>
      ) : (
        <span className="rounded-[var(--radius-pill)] bg-[var(--color-cream)] border border-[var(--color-border)] text-[var(--color-faint)] text-[13px] font-semibold px-5 py-2.5 whitespace-nowrap ml-4">
          Not yet signed
        </span>
      )}
    </div>
  );
}

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const engagement = await getEngagement(client);
  if (!engagement) notFound();

  const hasSow = engagement.sowSigned || Boolean(engagement.sowDocumentPath);
  const hasMsa = engagement.msaSigned || Boolean(engagement.msaDocumentPath);

  if (!hasSow && !hasMsa) {
    return (
      <PlaceholderTab
        title="Documents"
        description="Signed contracts will appear here once they're signed."
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <Card className="px-9 py-8">
        <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">{engagement.engagementTitle}</h2>
        <div className="space-y-3">
          {hasSow && (
            <DocumentRow
              label="Statement of Work"
              signed={engagement.sowSigned}
              documentPath={engagement.sowDocumentPath}
              downloadHref={`/api/portal/documents/${client}/sow`}
            />
          )}
          {hasMsa && (
            <DocumentRow
              label="Master Services Agreement"
              signed={engagement.msaSigned}
              documentPath={engagement.msaDocumentPath}
              downloadHref={`/api/portal/documents/${client}/msa`}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
