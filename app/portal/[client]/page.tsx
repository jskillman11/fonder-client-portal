import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getEngagement } from "@/lib/get-engagement";
import { getPortalCopy, renderTemplate } from "@/lib/portal-copy";
import { hasValidSession, getPortalCookieName } from "@/lib/portal-access";
import { isAdminSession } from "@/lib/supabase/server";
import { AccessGate } from "@/components/AccessGate";
import { WelcomeHero } from "@/components/WelcomeHero";
import { TeamIntro } from "@/components/TeamIntro";
import { WhatsNext } from "@/components/WhatsNext";
import { ReviewAndSignList } from "@/components/ReviewAndSignList";

export const dynamic = "force-dynamic";

export default async function PortalPage({
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

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(getPortalCookieName(client))?.value;
  const [hasSession, isAdmin] = await Promise.all([
    hasValidSession(client, sessionCookie),
    isAdminSession(),
  ]);
  const isAuthorized = hasSession || isAdmin;

  if (!isAuthorized) {
    return <AccessGate clientSlug={client} />;
  }

  const templateVars = {
    engagementTitle: engagement.engagementTitle,
    clientFirstName: engagement.clientSignatoryFirstName,
    clientName: engagement.clientName,
  };

  return (
    <main className="min-h-screen bg-[var(--color-cream)] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <WelcomeHero
          greeting={renderTemplate(copy.welcome_greeting, templateVars)}
          clientName={engagement.clientName}
          clientLogoUrl={engagement.clientLogoUrl}
          subtitle={renderTemplate(copy.welcome_subtitle, templateVars)}
        />
        <TeamIntro
          team={engagement.team}
          heading={copy.team_heading}
          subheading={copy.team_subheading}
        />
        <WhatsNext
          heading={copy.whats_next_heading}
          subheading={copy.whats_next_subheading}
          steps={[
            { title: copy.whats_next_step_1_title, body: copy.whats_next_step_1_body },
            { title: copy.whats_next_step_2_title, body: copy.whats_next_step_2_body },
            { title: copy.whats_next_step_3_title, body: copy.whats_next_step_3_body },
          ]}
        />
        <ReviewAndSignList
          clientSlug={engagement.clientSlug}
          hasSow={Boolean(engagement.sowContentMarkdown)}
          hasMsa={Boolean(engagement.msaContentMarkdown)}
          totalFee={engagement.totalFee}
          finalDeliveryDate={engagement.finalDeliveryDate}
          heading={copy.review_sign_heading}
          subheading={copy.review_sign_subheading}
          sowLabel={copy.sow_label}
          sowDescription={copy.sow_description}
          msaLabel={copy.msa_label}
          msaDescription={copy.msa_description}
        />
      </div>
      <p className="text-center text-[11px] text-[var(--color-faint)] mt-8">
        Fonder Studio · secure signing portal
      </p>
    </main>
  );
}
