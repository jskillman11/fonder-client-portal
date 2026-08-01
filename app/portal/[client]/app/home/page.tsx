import { Card } from "@/components/Card";

export default function ClientAppHomePage() {
  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <Card className="px-9 py-8">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-faint)] mb-2">
          Coming soon
        </p>
        <h2 className="text-[17px] font-bold text-[var(--color-ink)] mb-1">
          Action items
        </h2>
        <p className="text-[13.5px] text-[var(--color-muted)] leading-relaxed">
          Anything that needs your attention — approvals, requested feedback, open questions —
          will show up here.
        </p>
      </Card>

      <Card className="px-9 py-8">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-faint)] mb-2">
          Coming soon
        </p>
        <h2 className="text-[17px] font-bold text-[var(--color-ink)] mb-1">
          Next touchpoint
        </h2>
        <p className="text-[13.5px] text-[var(--color-muted)] leading-relaxed">
          Your next scheduled call or milestone check-in will be shown here.
        </p>
      </Card>

      <Card className="px-9 py-8">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-faint)] mb-2">
          Coming soon
        </p>
        <h2 className="text-[17px] font-bold text-[var(--color-ink)] mb-1">
          Project status
        </h2>
        <p className="text-[13.5px] text-[var(--color-muted)] leading-relaxed">
          Real-time updates on where things stand — no need to ask, you&apos;ll always know.
        </p>
      </Card>
    </div>
  );
}
