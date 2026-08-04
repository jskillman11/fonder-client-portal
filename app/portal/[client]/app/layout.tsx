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

  // The global tab unlock requires the whole onboarding flow done: documents
  // signed, invoice paid, AND kickoff actually booked (a real, persisted
  // Cal.com booking, not just reaching the step -- see
  // components/KickoffScheduler.tsx). A missing SOW or MSA trivially
  // satisfies its own half of docsSigned (a company using only one of the
  // two shouldn't be blocked on the other), but that must not extend to
  // having neither -- hasAnyDoc guards against that (mirrors the identical
  // check in app/portal/[client]/app/page.tsx).
  const hasAnyDoc = Boolean(engagement.sowContentMarkdown) || Boolean(engagement.msaContentMarkdown);
  const docsSigned =
    hasAnyDoc &&
    (!engagement.sowContentMarkdown || engagement.sowSigned) &&
    (!engagement.msaContentMarkdown || engagement.msaSigned);
  const onboardingComplete = docsSigned && engagement.invoicePaid && engagement.kickoffBooked;

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
