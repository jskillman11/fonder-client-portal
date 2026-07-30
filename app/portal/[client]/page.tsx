import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
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
  const engagement = await getEngagement(client);

  if (!engagement) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--color-cream)] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <WelcomeHero
          clientName={engagement.clientName}
          engagementTitle={engagement.engagementTitle}
          clientLogoUrl={engagement.clientLogoUrl}
        />
        <TeamIntro team={engagement.team} />
        <WhatsNext />
        <ReviewAndSignList
          clientSlug={engagement.clientSlug}
          hasSow={Boolean(engagement.sowContentMarkdown)}
          hasMsa={Boolean(engagement.msaContentMarkdown)}
          totalFee={engagement.totalFee}
          finalDeliveryDate={engagement.finalDeliveryDate}
        />
      </div>
      <p className="text-center text-[11px] text-[var(--color-faint)] mt-8">
        Fonder Studio · secure signing portal
      </p>
    </main>
  );
}
