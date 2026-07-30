import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { WelcomeHero } from "@/components/WelcomeHero";
import { TeamIntro } from "@/components/TeamIntro";
import { WhatsNext } from "@/components/WhatsNext";
import { DocumentContent } from "@/components/DocumentContent";
import { DocumentReview } from "@/components/DocumentReview";

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
        {engagement.sowContentMarkdown && (
          <DocumentContent
            title="Statement of Work"
            markdown={engagement.sowContentMarkdown}
          />
        )}
        {engagement.msaContentMarkdown && (
          <DocumentContent
            title="Master Services Agreement"
            markdown={engagement.msaContentMarkdown}
          />
        )}
        <DocumentReview engagement={engagement} />
      </div>
      <p className="text-center text-[11px] text-[var(--color-faint)] mt-8">
        Fonder Studio · secure signing portal
      </p>
    </main>
  );
}
