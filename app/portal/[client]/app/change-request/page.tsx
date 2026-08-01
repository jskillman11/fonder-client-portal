import { Card } from "@/components/Card";

export default function ChangeRequestPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Card className="px-9 py-8">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-faint)] mb-2">
          Coming soon
        </p>
        <h1 className="text-[19px] font-bold text-[var(--color-ink)] mb-2">
          Request a change
        </h1>
        <p className="text-[14px] text-[var(--color-muted)] leading-relaxed mb-6">
          Request a new date and priority for a change to your project. We&apos;ll show you which
          tasks are affected, the new timeline, and any budget impact — you decide whether to
          accept before anything changes.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4 opacity-50 pointer-events-none">
          <div>
            <label className="text-[13px] font-medium text-[var(--color-muted)]">
              Requested date
            </label>
            <input
              type="date"
              disabled
              className="w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]"
            />
          </div>
          <div>
            <label className="text-[13px] font-medium text-[var(--color-muted)]">
              Priority
            </label>
            <select
              disabled
              className="w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]"
            >
              <option>Standard</option>
              <option>Urgent</option>
            </select>
          </div>
        </div>

        <button
          disabled
          className="rounded-[var(--radius-pill)] bg-[var(--color-border)] text-[var(--color-faint)] text-[13px] font-semibold px-5 py-2.5 cursor-not-allowed"
        >
          Check impact — coming soon
        </button>
      </Card>

      <Card className="px-9 py-8 opacity-60">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-faint)] mb-3">
          Once built, this will show
        </p>
        <ul className="space-y-2 text-[13.5px] text-[var(--color-muted)]">
          <li>— Which task(s) are affected by this change</li>
          <li>— Their new timelines</li>
          <li>— Any impact to the project budget</li>
          <li>— A clear accept / decline choice before anything is finalized</li>
        </ul>
      </Card>
    </div>
  );
}
