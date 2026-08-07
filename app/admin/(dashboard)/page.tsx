import { listCompanies } from "@/lib/companies-clients";
import { listAllCompanyEngagements } from "@/lib/get-engagement";
import { Card } from "@/components/Card";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [companies, engagements] = await Promise.all([
    listCompanies(),
    listAllCompanyEngagements(),
  ]);

  const configuredEngagements = engagements.filter((e) => e.engagementTitle);
  const pendingSignatures = configuredEngagements.filter((e) => !e.sowSigned || !e.msaSigned);
  const unpaidInvoices = engagements.filter((e) => e.qbInvoiceId && !e.invoicePaidAt);

  const stats = [
    { label: "Brands", value: companies.length },
    { label: "Pending signatures", value: pendingSignatures.length },
    { label: "Unpaid invoices", value: unpaidInvoices.length },
  ];

  return (
    <main className="py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-[20px] font-bold text-[var(--color-ink)]">Home</h1>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label} className="px-5 py-4">
              <p className="text-2xl font-bold text-[var(--color-ink)]">{s.value}</p>
              <p className="text-[13px] text-[var(--color-muted-text)]">{s.label}</p>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
