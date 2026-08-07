import Link from "next/link";
import { listCompanies } from "@/lib/companies-clients";
import { listAllCompanyEngagements } from "@/lib/get-engagement";
import { listStaff } from "@/lib/staff";
import { Card } from "@/components/Card";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [companies, engagements, staff] = await Promise.all([
    listCompanies(),
    listAllCompanyEngagements(),
    listStaff(),
  ]);

  const configuredEngagements = engagements.filter((e) => e.engagementTitle);
  const pendingSignatures = configuredEngagements.filter((e) => !e.sowSigned || !e.msaSigned);
  const unpaidInvoices = engagements.filter((e) => e.qbInvoiceId && !e.invoicePaidAt);
  const recent = configuredEngagements.slice(0, 6);

  const stats = [
    { label: "Brands", value: companies.length },
    { label: "Engagements configured", value: configuredEngagements.length },
    { label: "Pending signatures", value: pendingSignatures.length },
    { label: "Unpaid invoices", value: unpaidInvoices.length },
  ];

  return (
    <main className="py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-[20px] font-bold text-[var(--color-ink)]">Home</h1>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="px-5 py-4">
              <p className="text-2xl font-bold text-[var(--color-ink)]">{s.value}</p>
              <p className="text-[13px] text-[var(--color-muted-text)]">{s.label}</p>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-3 text-sm font-semibold text-[var(--color-ink)]">
          <Link href="/admin/companies" className="underline hover:no-underline">
            Manage brands
          </Link>
          <span className="text-[var(--color-border)]">·</span>
          <Link href="/admin/settings/team" className="underline hover:no-underline">
            {staff.length} staff {staff.length === 1 ? "member" : "members"}
          </Link>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-ink)] mb-2">Recent engagements</h2>
          {recent.length === 0 ? (
            <Card className="px-7 py-9 text-center">
              <p className="text-[14px] text-[var(--color-muted-text)]">No engagements yet.</p>
            </Card>
          ) : (
            <Card className="px-7 py-2">
              {recent.map((e) => (
                <Link
                  key={e.companyId}
                  href={`/admin/companies/${e.companyId}`}
                  className="flex items-center justify-between gap-3 py-3 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-cream)] -mx-7 px-7"
                >
                  <div>
                    <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">{e.engagementTitle}</p>
                    <p className="text-[13px] text-[var(--color-muted-text)]">{e.companyName}</p>
                  </div>
                  <span className="text-[12px] uppercase tracking-wide text-[var(--color-muted-text)]">
                    {e.invoicePaidAt ? "paid" : e.qbInvoiceId ? "invoiced" : "in progress"}
                  </span>
                </Link>
              ))}
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
