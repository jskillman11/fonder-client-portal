"use client";

import { useState } from "react";
import { Card } from "./Card";
import { KickoffScheduler } from "./KickoffScheduler";
import { SignActionsList } from "./SignActionsList";
import { PayInvoiceAction } from "./PayInvoiceAction";

export function WhatsNext({
  heading,
  subheading,
  steps,
  clientSlug,
  hasSow,
  hasMsa,
  sowSigned,
  msaSigned,
  docsSigned,
  sowLabel,
  sowDescription,
  msaLabel,
  msaDescription,
  calLink,
  kickoffEarliestDate,
  kickoffBooked,
  kickoffStartTime,
  qbInvoiceLink,
  invoicePaid,
  companyId,
  canSimulatePayment,
}: {
  heading: string;
  subheading: string;
  steps: { title: string; body: string }[];
  clientSlug: string;
  hasSow: boolean;
  hasMsa: boolean;
  sowSigned: boolean;
  msaSigned: boolean;
  docsSigned: boolean;
  sowLabel: string;
  sowDescription: string;
  msaLabel: string;
  msaDescription: string;
  calLink?: string;
  kickoffEarliestDate?: string | null;
  kickoffBooked: boolean;
  kickoffStartTime: string | null;
  qbInvoiceLink: string | null;
  invoicePaid: boolean;
  companyId: string;
  canSimulatePayment?: boolean;
}) {
  const [booked, setBooked] = useState(kickoffBooked);
  const [paid, setPaid] = useState(invoicePaid);
  const allStepsComplete = docsSigned && booked && paid;

  return (
    <Card className="px-9 py-9 md:px-12 md:py-10">
      <h2 className="text-[19px] font-bold text-[var(--color-ink)] mb-1">
        {heading}
      </h2>
      <p className="text-[14px] text-[var(--color-muted-text)] mb-6">
        {subheading}
      </p>
      <div className="space-y-4">
        {steps.map((step, i) => {
          // Sequential, not "everything after step 1 unlocks together": step
          // 2 (pay invoice) gates on docs signed; step 3 (kickoff) gates on
          // top of that on the invoice actually being paid, not just reached.
          const lockedStep2 = !docsSigned;
          const lockedStep3 = !docsSigned || !paid;
          const locked = i === 1 ? lockedStep2 : i === 2 ? lockedStep3 : false;

          return (
            <div
              key={step.title}
              className={`rounded-[14px] border px-5 py-4 transition-opacity ${
                locked
                  ? "border-[var(--color-border)] opacity-45"
                  : "border-[var(--color-border)]"
              }`}
            >
              <div className="flex gap-4">
                <div className="w-7 h-7 shrink-0 rounded-full bg-[var(--color-cream)] border border-[var(--color-border)] flex items-center justify-center text-[12.5px] font-semibold text-[var(--color-ink)]">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">
                    {step.title}
                  </p>
                  <p className="text-[13.5px] text-[var(--color-muted-text)] leading-relaxed">
                    {step.body}
                  </p>

                  {i === 0 && (
                    <SignActionsList
                      clientSlug={clientSlug}
                      hasSow={hasSow}
                      hasMsa={hasMsa}
                      sowSigned={sowSigned}
                      msaSigned={msaSigned}
                      sowLabel={sowLabel}
                      sowDescription={sowDescription}
                      msaLabel={msaLabel}
                      msaDescription={msaDescription}
                    />
                  )}

                  {i === 1 &&
                    (locked ? (
                      <p className="text-[12px] text-[var(--color-faint)] mt-3">
                        Unlocks once your documents are signed.
                      </p>
                    ) : (
                      <PayInvoiceAction
                        invoiceLink={qbInvoiceLink}
                        invoicePaid={paid}
                        companyId={companyId}
                        canSimulate={canSimulatePayment}
                        onSimulated={() => setPaid(true)}
                      />
                    ))}

                  {i === 2 &&
                    (locked ? (
                      <p className="text-[12px] text-[var(--color-faint)] mt-3">
                        {!docsSigned
                          ? "Unlocks once your documents are signed."
                          : "Unlocks once your invoice is paid."}
                      </p>
                    ) : (
                      calLink && (
                        <div className="mt-3">
                          <KickoffScheduler
                            clientSlug={clientSlug}
                            calLink={calLink}
                            kickoffEarliestDate={kickoffEarliestDate ?? null}
                            kickoffBooked={booked}
                            kickoffStartTime={kickoffStartTime}
                            onBooked={() => setBooked(true)}
                          />
                        </div>
                      )
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {allStepsComplete && (
        <div className="mt-4 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-cream)] px-5 py-4 text-center">
          <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">
            Onboarding completed
          </p>
          <p className="text-[13px] text-[var(--color-muted-text)] mt-0.5">
            You&apos;re all set — explore the rest of your portal using the tabs above.
          </p>
        </div>
      )}
    </Card>
  );
}
