import { notFound } from "next/navigation";
import { getCompany } from "@/lib/companies-clients";
import { BackButton } from "@/components/admin/BackButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
          <Avatar className="h-8 w-8 rounded-lg after:rounded-lg">
            {company.logoUrl && <AvatarImage src={company.logoUrl} alt={company.name} className="rounded-lg object-cover" />}
            <AvatarFallback className="rounded-lg">{company.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <h1 className="text-[20px] font-bold text-[var(--color-ink)]">{company.name}</h1>
        </div>

        {children}
      </div>
    </main>
  );
}
