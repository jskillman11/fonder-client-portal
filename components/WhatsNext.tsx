"use client";

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
}) {
  return (
    <Card className="px-9 py-9 md:px-12 md:py-10">
      <h2 className="text-[19px] font-bold text-[var(--color-ink)] mb-1">
        {heading}
      </h2>
      <p className="text-[14px] text-[var(--color-muted)] mb-6">
        {subheading}
      </p>
      <div className="space-y-4">
        {steps.map((step, i) => {
          const locked = i > 0 && !docsSigned;

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
                  <p className="text-[13.5px] text-[var(--color-muted)] leading-relaxed">
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
                        Unlocks once your documents are sent for signature.
                      </p>
                    ) : (
                      <PayInvoiceAction />
                    ))}

                  {i === 2 &&
                    (locked ? (
                      <p className="text-[12px] text-[var(--color-faint)] mt-3">
                        Unlocks once your documents are sent for signature.
                      </p>
                    ) : (
                      calLink && (
                        <div className="mt-3">
                          <KickoffScheduler
                            clientSlug={clientSlug}
                            calLink={calLink}
                            kickoffEarliestDate={kickoffEarliestDate ?? null}
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
    </Card>
  );
}
