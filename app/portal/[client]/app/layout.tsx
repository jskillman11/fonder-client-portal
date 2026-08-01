import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { hasPortalAccess } from "@/lib/supabase/server";
import { AccessGate } from "@/components/AccessGate";
import { ClientAppNav } from "@/components/portal-app/ClientAppNav";
import { ClientAccountMenu } from "@/components/portal-app/ClientAccountMenu";
import { AppUnlockProvider } from "@/components/portal-app/AppUnlockContext";

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

  return (
    <AppUnlockProvider>
      <ClientAppNav
        clientSlug={client}
        lockEnabled={engagement.lockPortalTabs}
        tabLockOverrides={engagement.tabLockOverrides}
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
    </AppUnlockProvider>
  );
}
