import { notFound } from "next/navigation";
import { getCompany } from "@/lib/companies-clients";

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
        {children}
      </div>
    </main>
  );
}
