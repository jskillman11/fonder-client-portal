import Link from "next/link";

export function SignActionsList({
  clientSlug,
  hasSow,
  hasMsa,
  sowSigned,
  msaSigned,
  sowLabel,
  sowDescription,
  msaLabel,
  msaDescription,
}: {
  clientSlug: string;
  hasSow: boolean;
  hasMsa: boolean;
  sowSigned: boolean;
  msaSigned: boolean;
  sowLabel: string;
  sowDescription: string;
  msaLabel: string;
  msaDescription: string;
}) {
  const docs = [
    hasSow && { key: "sow" as const, label: sowLabel, description: sowDescription, signed: sowSigned },
    hasMsa && { key: "msa" as const, label: msaLabel, description: msaDescription, signed: msaSigned },
  ].filter(Boolean) as { key: "sow" | "msa"; label: string; description: string; signed: boolean }[];

  return (
    <div className="space-y-3 mt-3">
      {docs.map((doc) => (
        <div
          key={doc.key}
          className="flex items-center justify-between rounded-[14px] border border-[var(--color-border)] px-5 py-4"
        >
          <div>
            <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">{doc.label}</p>
            <p className="text-[13px] text-[var(--color-muted)] mt-0.5">{doc.description}</p>
          </div>
          {doc.signed ? (
            <span className="rounded-[var(--radius-pill)] bg-[var(--color-cream)] text-[var(--color-ink)] border border-[var(--color-border)] text-[13px] font-semibold px-5 py-2.5 whitespace-nowrap ml-4">
              Signed
            </span>
          ) : (
            <Link
              href={`/portal/${clientSlug}/sign/${doc.key}`}
              className="rounded-[var(--radius-pill)] bg-[var(--color-ink)] text-white text-[13px] font-semibold px-5 py-2.5 whitespace-nowrap ml-4"
            >
              Review &amp; sign
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
