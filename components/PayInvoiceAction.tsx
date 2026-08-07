import { SimulatePaymentButton } from "./SimulatePaymentButton";

export function PayInvoiceAction({
  invoiceLink,
  invoicePaid,
  companyId,
  canSimulate,
  onSimulated,
}: {
  invoiceLink: string | null;
  invoicePaid: boolean;
  companyId?: string;
  canSimulate?: boolean;
  onSimulated?: () => void;
}) {
  if (invoicePaid) {
    return (
      <div className="mt-3">
        <span className="rounded-[var(--radius-pill)] bg-[var(--color-cream)] border border-[var(--color-border)] text-[var(--color-ink)] text-[13px] font-semibold px-5 py-2.5 inline-block">
          Invoice paid
        </span>
      </div>
    );
  }

  if (invoiceLink) {
    return (
      <div className="mt-3">
        <a
          href={invoiceLink}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-[var(--radius-pill)] bg-[var(--color-ink)] text-white text-[13px] font-semibold px-5 py-2.5 inline-block hover:opacity-90"
        >
          Pay invoice
        </a>
        {canSimulate && companyId && (
          <SimulatePaymentButton companyId={companyId} onSimulated={onSimulated} />
        )}
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button
        disabled
        className="rounded-[var(--radius-pill)] bg-[var(--color-border)] text-[var(--color-faint)] text-[13px] font-semibold px-5 py-2.5 cursor-not-allowed"
      >
        Invoice not yet available
      </button>
    </div>
  );
}
