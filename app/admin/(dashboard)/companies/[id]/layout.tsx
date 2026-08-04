import { notFound } from "next/navigation";
import { getCompany } from "@/lib/companies-clients";
import { BackButton } from "@/components/admin/BackButton";

export const dynamic = "force-dynamic";

export default async function CompanyLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <BackButton />

        <div className="flex items-center gap-3">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoUrl} alt={company.name} className="h-8 w-auto max-w-[100px] object-contain" />
          ) : (
            <div className="h-8 w-8 rounded bg-[var(--color-cream)] border border-[var(--color-border)]" />
          )}
          <h1 className="text-[20px] font-bold text-[var(--color-ink)]">{company.name}</h1>
        </div>

        {children}
      </div>
    </main>
  );
}
