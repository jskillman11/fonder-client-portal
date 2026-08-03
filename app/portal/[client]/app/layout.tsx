import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { hasPortalAccess } from "@/lib/supabase/server";
import { AccessGate } from "@/components/AccessGate";
import { ClientAppNav } from "@/components/portal-app/ClientAppNav";
import { ClientAccountMenu } from "@/components/portal-app/ClientAccountMenu";

export const dynamic = "force-dynamic";

export default async function ClientAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const engagement = await getEngagement(client);
  if (!engagement) notFound();

  const { authorized, isAdmin } = await hasPortalAccess(client);

  if (!authorized) {
    return <AccessGate clientSlug={client} />;
  }

  const docsSigned =
    (!engagement.sowContentMarkdown || engagement.sowSigned) &&
    (!engagement.msaContentMarkdown || engagement.msaSigned);

  return (
    <ClientAppNav
      clientSlug={client}
      lockEnabled={engagement.lockPortalTabs}
      tabLockOverrides={engagement.tabLockOverrides}
      docsSigned={docsSigned}
      accountSlot={
        <ClientAccountMenu
          clientSlug={client}
          hasSession={!isAdmin}
          isAdmin={isAdmin}
          clientName={engagement.clientSignatoryName}
        />
      }
    >
      {children}
    </ClientAppNav>
  );
}
