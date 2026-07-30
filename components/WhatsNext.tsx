import { Card } from "./Card";

export function WhatsNext({
  heading,
  subheading,
  steps,
}: {
  heading: string;
  subheading: string;
  steps: { title: string; body: string }[];
}) {
  return (
    <Card className="px-9 py-9 md:px-12 md:py-10">
      <h2 className="text-[19px] font-bold text-[var(--color-ink)] mb-1">
        {heading}
      </h2>
      <p className="text-[14px] text-[var(--color-muted)] mb-6">
        {subheading}
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
