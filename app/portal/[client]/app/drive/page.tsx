import { notFound, redirect } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
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

  redirect(engagement.sharedDriveUrl);
}
