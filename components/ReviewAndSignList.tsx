import Link from "next/link";
import { Card } from "./Card";

export function ReviewAndSignList({
  clientSlug,
  hasSow,
  hasMsa,
  totalFee,
  finalDeliveryDate,
  heading,
  subheading,
  sowLabel,
  sowDescription,
  msaLabel,
  msaDescription,
}: {
  clientSlug: string;
  hasSow: boolean;
  hasMsa: boolean;
  totalFee: string;
  finalDeliveryDate: string;
  heading: string;
  subheading: string;
  sowLabel: string;
  sowDescription: string;
  msaLabel: string;
  msaDescription: string;
}) {
  const docs = [
    hasSow && { key: "sow", label: sowLabel, description: sowDescription },
    hasMsa && { key: "msa", label: msaLabel, description: msaDescription },
  ].filter(Boolean) as { key: string; label: string; description: string }[];

  return (
    <Card className="px-9 py-9 md:px-12 md:py-10">
      <h2 className="text-[19px] font-bold text-[var(--color-ink)] mb-1">
        {heading}
      </h2>
      <p className="text-[14px] text-[var(--color-muted)] mb-6">
        {subheading}
      </p>

      <div className="space-y-3 mb-7">
        {docs.map((doc) => (
          <div
            key={doc.key}
            className="flex items-center justify-between rounded-[14px] border border-[var(--color-border)] px-5 py-4"
          >
            <div>
              <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">
                {doc.label}
              </p>
              <p className="text-[13px] text-[var(--color-muted)] mt-0.5">
                {doc.description}
              </p>
            </div>
            <Link
              href={`/portal/${clientSlug}/sign/${doc.key}`}
              className="rounded-[var(--radius-pill)] bg-[var(--color-ink)] text-white text-[13px] font-semibold px-5 py-2.5 whitespace-nowrap ml-4"
            >
              Review &amp; sign
            </Link>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-[14px] bg-[var(--color-cream)] px-5 py-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Total fee
          </p>
          <p className="text-[15px] font-semibold text-[var(--color-ink)]">
            {totalFee}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Final delivery
          </p>
          <p className="text-[15px] font-semibold text-[var(--color-ink)]">
            {finalDeliveryDate}
          </p>
        </div>
      </div>
    </Card>
  );
}
