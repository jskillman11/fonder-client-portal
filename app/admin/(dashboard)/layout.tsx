import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[var(--color-cream)]">
      <AdminSidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
