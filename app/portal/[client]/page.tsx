import { notFound, redirect } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { hasPortalAccess } from "@/lib/supabase/server";
import { AccessGate } from "@/components/AccessGate";

export const dynamic = "force-dynamic";

export default async function PortalPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const engagement = await getEngagement(client);

  if (!engagement) {
    notFound();
  }

  const { authorized } = await hasPortalAccess(client);

  if (!authorized) {
    return <AccessGate clientSlug={client} />;
  }

  redirect(`/portal/${client}/app/home`);
}
