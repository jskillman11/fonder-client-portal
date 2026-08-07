import { redirect } from "next/navigation";

// Brand Settings is a collapsible nav parent with no page of its own (see
// AdminNav's computeNavItems) -- this bare route only exists for anyone
// hitting it directly (old links/bookmarks), and lands on the first
// sub-tab.
export default async function CompanySettingsBasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/companies/${id}/settings/company`);
}
