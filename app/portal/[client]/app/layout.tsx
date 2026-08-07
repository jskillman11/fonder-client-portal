import { notFound } from "next/navigation";
import { getEngagement, computeDocsSigned } from "@/lib/get-engagement";
import { hasPortalAccess, getAdminUser } from "@/lib/supabase/server";
import { getClient } from "@/lib/companies-clients";
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

  const adminUser = isAdmin ? await getAdminUser() : null;
  // Fetched regardless of isAdmin -- staff previewing via "View as client"
  // should see the real client's avatar/role too, not just their name.
  const clientRecord = engagement.clientId ? await getClient(engagement.clientId) : null;

  // The global tab unlock requires the whole onboarding flow done: documents
  // signed, invoice paid, AND kickoff actually booked (a real, persisted
  // Cal.com booking, not just reaching the step -- see
  // components/KickoffScheduler.tsx).
  const docsSigned = computeDocsSigned(engagement);
  const onboardingComplete = docsSigned && engagement.invoicePaid && engagement.kickoffBooked;

  return (
    <ClientAppNav
      clientSlug={client}
      companyName={engagement.clientName}
      companyLogoUrl={engagement.clientLogoUrl}
      engagementTitle={engagement.engagementTitle}
      lockEnabled={engagement.lockPortalTabs}
      tabLockOverrides={engagement.tabLockOverrides}
      onboardingComplete={onboardingComplete}
      accountSlot={
        <ClientAccountMenu
          clientSlug={client}
          hasSession={!isAdmin}
          isAdmin={isAdmin}
          clientName={engagement.clientSignatoryName}
          clientEmail={engagement.clientSignatoryEmail}
          clientJobTitle={clientRecord?.jobTitle}
          clientAvatarUrl={clientRecord?.avatarUrl}
          adminEmail={adminUser?.email}
          adminFullName={adminUser?.fullName}
          adminJobTitle={adminUser?.jobTitle}
          adminAvatarUrl={adminUser?.avatarUrl}
          adminIconBgColor={adminUser?.iconBgColor}
          adminIconTextColor={adminUser?.iconTextColor}
        />
      }
    >
      {children}
    </ClientAppNav>
  );
}
