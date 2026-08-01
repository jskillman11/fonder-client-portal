import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getEngagement } from "@/lib/get-engagement";
import { hasValidSession, getPortalCookieName } from "@/lib/portal-access";
import { isAdminSession } from "@/lib/supabase/server";
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

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(getPortalCookieName(client))?.value;
  const [hasSession, isAdmin] = await Promise.all([
    hasValidSession(client, sessionCookie),
    isAdminSession(),
  ]);

  if (!hasSession && !isAdmin) {
    return <AccessGate clientSlug={client} />;
  }

  return (
    <AppUnlockProvider>
      <ClientAppNav
        clientSlug={client}
        lockEnabled={engagement.lockPortalTabs}
        accountSlot={
          <ClientAccountMenu
            clientSlug={client}
            hasSession={hasSession}
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
