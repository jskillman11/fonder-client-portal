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

  // The global tab unlock requires the whole onboarding flow done -- not
  // just documents signed. Steps 1 (Pay invoice) and 2 (Schedule kickoff)
  // unlock together once documents are signed (step 2 has nothing of its
  // own to complete yet, pending real invoicing), but the OTHER portal tabs
  // (Tasks/Chat/Invoices/Deliverables/etc.) stay locked until a kickoff is
  // actually booked -- a real, persisted Cal.com booking, not just reaching
  // the step (see components/KickoffScheduler.tsx).
  const docsSigned =
    (!engagement.sowContentMarkdown || engagement.sowSigned) &&
    (!engagement.msaContentMarkdown || engagement.msaSigned);
  const onboardingComplete = docsSigned && engagement.kickoffBooked;

  return (
    <ClientAppNav
      clientSlug={client}
      lockEnabled={engagement.lockPortalTabs}
      tabLockOverrides={engagement.tabLockOverrides}
      onboardingComplete={onboardingComplete}
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
