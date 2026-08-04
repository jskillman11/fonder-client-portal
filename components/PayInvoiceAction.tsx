export function PayInvoiceAction({
  invoiceLink,
  invoicePaid,
}: {
  invoiceLink: string | null;
  invoicePaid: boolean;
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
