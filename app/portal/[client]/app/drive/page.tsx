import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { Card } from "@/components/Card";
import { PlaceholderTab } from "@/components/portal-app/PlaceholderTab";

export const dynamic = "force-dynamic";

export default async function DrivePage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const engagement = await getEngagement(client);
  if (!engagement) notFound();

  if (!engagement.sharedDriveUrl) {
    return (
      <PlaceholderTab
        title="Shared Drive"
        description="Shared files, links, and reference material for this engagement."
      />
    );
  }

  return (
    <Card className="px-9 py-14 text-center">
      <h1 className="text-[19px] font-bold text-[var(--color-ink)] mb-2">
        Shared Drive
      </h1>
      <p className="text-[14px] text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed mb-5">
        Shared files, links, and reference material for this engagement.
      </p>
      <a
        href={engagement.sharedDriveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-[var(--radius-pill)] bg-[var(--color-ink)] text-white text-[13px] font-semibold px-5 py-2.5"
      >
        Open shared drive
      </a>
    </Card>
  );
}
