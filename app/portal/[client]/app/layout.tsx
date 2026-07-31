import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getEngagement } from "@/lib/get-engagement";
import { hasValidSession, getPortalCookieName } from "@/lib/portal-access";
import { isAdminSession } from "@/lib/supabase/server";
import { AccessGate } from "@/components/AccessGate";
import { ClientAppNav } from "@/components/portal-app/ClientAppNav";

export const dynamic = "force-dynamic";

export default async function ClientAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const engagement = await getEngagement(client);
  if (!engagement) notFound();

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(getPortalCookieName(client))?.value;
  const [hasSession, isAdmin] = await Promise.all([
    hasValidSession(client, sessionCookie),
    isAdminSession(),
  ]);

  if (!hasSession && !isAdmin) {
    return <AccessGate clientSlug={client} />;
  }

  return (
    <main className="min-h-screen bg-[var(--color-cream)] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <ClientAppNav clientSlug={client} />
        {children}
      </div>
    </main>
  );
}
