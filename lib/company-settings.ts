import { createServiceClient } from "./supabase/server";
import type { TabLockState } from "./portal-app-tabs";

export type CompanySettings = {
  companyId: string;
  sowDocumentId: string | null;
  msaDocumentId: string | null;
  lockPortalTabs: boolean;
  sharedDriveUrl: string | null;
  tabLockOverrides: Record<string, TabLockState>;
};

export async function getCompanySettings(companyId: string): Promise<CompanySettings | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, sow_document_id, msa_document_id, lock_portal_tabs, shared_drive_url, tab_lock_overrides")
    .eq("id", companyId)
    .single();

  if (error || !data) return null;
  return {
    companyId: data.id,
    sowDocumentId: data.sow_document_id,
    msaDocumentId: data.msa_document_id,
    lockPortalTabs: data.lock_portal_tabs,
    sharedDriveUrl: data.shared_drive_url,
    tabLockOverrides: data.tab_lock_overrides ?? {},
  };
}
