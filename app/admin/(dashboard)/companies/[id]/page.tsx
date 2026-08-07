import { redirect } from "next/navigation";

// Company Overview was folded entirely into Brand Settings (Company +
// Client & Schedule sub-tabs) -- this bare route just lands on the first
// of them so old links/bookmarks still go somewhere sensible.
export default async function CompanyBasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/companies/${id}/settings/company`);
}
