import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { getClient } from "@/lib/companies-clients";
import { ClientProfileForm } from "@/components/portal-app/ClientProfileForm";

export const dynamic = "force-dynamic";

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const engagement = await getEngagement(client);
  if (!engagement || !engagement.clientId) notFound();

  const clientRecord = await getClient(engagement.clientId);
  if (!clientRecord) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <ClientProfileForm client={clientRecord} />
    </div>
  );
}
