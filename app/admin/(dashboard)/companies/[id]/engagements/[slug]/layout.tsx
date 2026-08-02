import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/get-engagement";
import { BackButton } from "@/components/admin/BackButton";

export const dynamic = "force-dynamic";

export default async function EngagementLayout({
  params,
  children,
}: {
  params: Promise<{ id: string; slug: string }>;
  children: React.ReactNode;
}) {
  const { id, slug } = await params;
  const engagement = await getEngagement(slug);

  if (!engagement || engagement.companyId !== id) notFound();

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <BackButton />
          <h1 className="text-[19px] font-bold text-[var(--color-ink)]">
            {engagement.engagementTitle}
          </h1>
          <p className="text-[13px] text-[var(--color-muted)]">{engagement.clientName}</p>
        </div>
        {children}
      </div>
    </main>
  );
}
