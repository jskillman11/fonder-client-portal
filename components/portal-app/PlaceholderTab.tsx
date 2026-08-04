import { Card } from "@/components/Card";

export function PlaceholderTab({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <Card className="px-9 py-14 text-center md:col-span-2 xl:col-span-3">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-faint)] mb-2">
          Coming soon
        </p>
        <h1 className="text-[19px] font-bold text-[var(--color-ink)] mb-2">
          {title}
        </h1>
        <p className="text-[14px] text-[var(--color-muted-text)] max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </Card>
    </div>
  );
}
