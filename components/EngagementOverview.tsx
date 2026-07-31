import { Card } from "./Card";

export function EngagementOverview({
  heading,
  subheading,
  scopeSummary,
  totalFee,
  finalDeliveryDate,
}: {
  heading: string;
  subheading: string;
  scopeSummary: string | null;
  totalFee: string;
  finalDeliveryDate: string;
}) {
  return (
    <Card className="px-9 py-9 md:px-12 md:py-10">
      <h2 className="text-[19px] font-bold text-[var(--color-ink)] mb-1">
        {heading}
      </h2>
      <p className="text-[14px] text-[var(--color-muted)] mb-6">
        {subheading}
      </p>

      {scopeSummary && (
        <div className="mb-6">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)] mb-1">
            Scope
          </p>
          <p className="text-[14px] text-[var(--color-ink)] leading-relaxed">
            {scopeSummary}
          </p>
        </div>
      )}

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
