"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import { engagements } from "@/lib/engagements";
import { WelcomeHero } from "@/components/WelcomeHero";
import { TeamIntro } from "@/components/TeamIntro";
import { WhatsNext } from "@/components/WhatsNext";
import { DocumentReview } from "@/components/DocumentReview";

export default function PortalPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = use(params);
  const engagement = engagements[client];

  if (!engagement) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--color-cream)] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <WelcomeHero
          clientName={engagement.clientName}
          engagementTitle={engagement.engagementTitle}
        />
        <TeamIntro team={engagement.team} />
        <WhatsNext />
        <DocumentReview engagement={engagement} />
      </div>
      <p className="text-center text-[11px] text-[var(--color-faint)] mt-8">
        Fonder Studio · secure signing portal
      </p>
    </main>
  );
}
