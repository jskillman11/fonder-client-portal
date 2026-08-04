import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { getPortalCopy, renderTemplate } from "@/lib/portal-copy";
import { WelcomeHero } from "@/components/WelcomeHero";
import { EngagementOverview } from "@/components/EngagementOverview";
import { TeamIntro } from "@/components/TeamIntro";
import { WhatsNext } from "@/components/WhatsNext";

export const dynamic = "force-dynamic";

export default async function OnboardingTabPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const [engagement, copy] = await Promise.all([
    getEngagement(client),
    getPortalCopy(),
  ]);

  if (!engagement) {
    notFound();
  }

  const docsSigned =
    (!engagement.sowContentMarkdown || engagement.sowSigned) &&
    (!engagement.msaContentMarkdown || engagement.msaSigned);

  const templateVars = {
    engagementTitle: engagement.engagementTitle,
    clientFirstName: engagement.clientSignatoryFirstName,
    clientName: engagement.clientName,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <WelcomeHero
        greeting={renderTemplate(copy.welcome_greeting, templateVars)}
        clientName={engagement.clientName}
        clientLogoUrl={engagement.clientLogoUrl}
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
      />
    </div>
  );
}
