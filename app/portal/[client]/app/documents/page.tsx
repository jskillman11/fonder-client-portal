import { notFound } from "next/navigation";
import { getCompanyEngagementHistory } from "@/lib/get-engagement";
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
  const history = await getCompanyEngagementHistory(client);
  if (!history) notFound();

  const engagementsWithDocs = history.engagements.filter(
    (e) => e.sowSigned || e.msaSigned || e.sowDocumentPath || e.msaDocumentPath,
  );

  if (engagementsWithDocs.length === 0) {
    return (
      <PlaceholderTab
        title="Documents"
        description="Signed contracts for this engagement will appear here once they're signed."
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {engagementsWithDocs.map((e) => (
        <Card key={e.id} className="px-9 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-[var(--color-ink)]">{e.engagementTitle}</h2>
            <span className="text-[12px] text-[var(--color-muted)] capitalize">{e.status}</span>
          </div>
          <div className="space-y-3">
            {(e.sowSigned || e.sowDocumentPath) && (
              <DocumentRow
                label="Statement of Work"
                signed={e.sowSigned}
                documentPath={e.sowDocumentPath}
                downloadHref={`/api/portal/documents/${client}/${e.id}/sow`}
              />
            )}
            {(e.msaSigned || e.msaDocumentPath) && (
              <DocumentRow
                label="Master Services Agreement"
                signed={e.msaSigned}
                documentPath={e.msaDocumentPath}
                downloadHref={`/api/portal/documents/${client}/${e.id}/msa`}
              />
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
