import { Card } from "./Card";

const steps = [
  {
    title: "You sign below",
    body: "Review and sign your Statement of Work and Master Services Agreement in one session.",
  },
  {
    title: "We schedule kickoff",
    body: "Within 2 business days, we'll reach out to schedule your kickoff call and get you set up in our shared Slack channel.",
  },
  {
    title: "Work begins",
    body: "Your project timeline starts per the dates in your Statement of Work — you'll always know what's happening and when.",
  },
];

export function WhatsNext() {
  return (
    <Card className="px-9 py-9 md:px-12 md:py-10">
      <h2 className="text-[19px] font-bold text-[var(--color-ink)] mb-1">
        What happens next
      </h2>
      <p className="text-[14px] text-[var(--color-muted)] mb-6">
        A quick look at the road ahead.
      </p>
      <div className="space-y-5">
        {steps.map((step, i) => (
          <div key={step.title} className="flex gap-4">
            <div className="w-7 h-7 shrink-0 rounded-full bg-[var(--color-cream)] border border-[var(--color-border)] flex items-center justify-center text-[12.5px] font-semibold text-[var(--color-ink)]">
              {i + 1}
            </div>
            <div>
              <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">
                {step.title}
              </p>
              <p className="text-[13.5px] text-[var(--color-muted)] leading-relaxed">
                {step.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
