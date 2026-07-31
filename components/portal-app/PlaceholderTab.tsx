import { Card } from "@/components/Card";

export function PlaceholderTab({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="px-9 py-14 text-center">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-faint)] mb-2">
        Coming soon
      </p>
      <h1 className="text-[19px] font-bold text-[var(--color-ink)] mb-2">
        {title}
      </h1>
      <p className="text-[14px] text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
    </Card>
  );
}
