import { isSuperAdminSession } from "@/lib/supabase/server";
import { getBrandLogoUrls } from "@/lib/brand-settings";
import { Card } from "@/components/Card";
import { BackButton } from "@/components/admin/BackButton";
import { EditBrandLogoForm } from "@/components/admin/EditBrandLogoForm";

export const dynamic = "force-dynamic";

export default async function BrandSettingsPage() {
  const isSuperAdmin = await isSuperAdminSession();

  if (!isSuperAdmin) {
    return (
      <main className="py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-5">
          <BackButton />
          <Card className="px-9 py-9 text-center">
            <p className="text-[14px] text-[var(--color-muted-text)]">
              Only super-admins can manage the brand logo.
            </p>
          </Card>
        </div>
      </main>
    );
  }

  const { login: loginLogoUrl, sidebar: sidebarLogoUrl } = await getBrandLogoUrls();

  return (
    <main className="py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <BackButton />
        <h1 className="text-[20px] font-bold text-[var(--color-ink)]">Brand</h1>
        <EditBrandLogoForm loginLogoUrl={loginLogoUrl} sidebarLogoUrl={sidebarLogoUrl} />
      </div>
    </main>
  );
}
