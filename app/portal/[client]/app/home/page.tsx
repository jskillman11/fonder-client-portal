import { notFound } from "next/navigation";
import { getEngagement, computeDocsSigned } from "@/lib/get-engagement";
import { getPortalCopy, renderTemplate } from "@/lib/portal-copy";
import { hasPortalAccess } from "@/lib/supabase/server";
import { WelcomeHero } from "@/components/WelcomeHero";
import { EngagementOverview } from "@/components/EngagementOverview";
import { TeamIntro } from "@/components/TeamIntro";
import { WhatsNext } from "@/components/WhatsNext";

export const dynamic = "force-dynamic";

export default async function HomeTabPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const [engagement, copy, { isAdmin }] = await Promise.all([
    getEngagement(client),
    getPortalCopy(),
    hasPortalAccess(client),
  ]);

  if (!engagement) {
    notFound();
  }

  // "Simulate payment" is a testing escape hatch for QuickBooks' sandbox,
  // which cannot actually process a card payment through the hosted invoice
  // page (see SETUP.md) -- restricted to staff previewing the portal, never
  // a real client's magic-link session, and hard-blocked once
  // QUICKBOOKS_ENVIRONMENT is "production" (the API route enforces this too).
  const canSimulatePayment = isAdmin && process.env.QUICKBOOKS_ENVIRONMENT !== "production";

  const docsSigned = computeDocsSigned(engagement);

  const templateVars = {
    engagementTitle: engagement.engagementTitle,
    clientFirstName: engagement.clientSignatoryFirstName,
    clientName: engagement.clientName,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <WelcomeHero
        greeting={renderTemplate(copy.welcome_greeting, templateVars)}
        subtitle={renderTemplate(copy.welcome_subtitle, templateVars)}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <EngagementOverview
          heading={copy.overview_heading}
          subheading={copy.overview_subheading}
          scopeSummary={engagement.scopeSummary}
          totalFee={engagement.totalFee}
          finalDeliveryDate={engagement.finalDeliveryDate}
          milestones={engagement.milestones}
        />
        <TeamIntro
          team={engagement.team}
          heading={copy.team_heading}
          subheading={copy.team_subheading}
        />
      </div>
      <WhatsNext
        heading={copy.whats_next_heading}
        subheading={copy.whats_next_subheading}
        steps={[
          { title: copy.whats_next_step_1_title, body: copy.whats_next_step_1_body },
          { title: copy.whats_next_step_2_title, body: copy.whats_next_step_2_body },
          { title: copy.whats_next_step_3_title, body: copy.whats_next_step_3_body },
        ]}
        clientSlug={engagement.clientSlug}
        hasSow={Boolean(engagement.sowContentMarkdown)}
        hasMsa={Boolean(engagement.msaContentMarkdown)}
        sowSigned={engagement.sowSigned}
        msaSigned={engagement.msaSigned}
        docsSigned={docsSigned}
        sowLabel={copy.sow_label}
        sowDescription={copy.sow_description}
        msaLabel={copy.msa_label}
        msaDescription={copy.msa_description}
        calLink={process.env.CAL_COM_EVENT_LINK}
        kickoffEarliestDate={engagement.kickoffEarliestDate}
        kickoffBooked={engagement.kickoffBooked}
        kickoffStartTime={engagement.kickoffStartTime}
        qbInvoiceLink={engagement.qbInvoiceLink}
        invoicePaid={engagement.invoicePaid}
        companyId={engagement.companyId ?? engagement.id}
        canSimulatePayment={canSimulatePayment}
      />
    </div>
  );
}
