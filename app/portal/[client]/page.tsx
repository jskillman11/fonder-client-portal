import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getEngagement } from "@/lib/get-engagement";
import { hasValidSession, getPortalCookieName } from "@/lib/portal-access";
import { isAdminSession } from "@/lib/supabase/server";
import { AccessGate } from "@/components/AccessGate";

export const dynamic = "force-dynamic";

export default async function PortalPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const engagement = await getEngagement(client);

  if (!engagement) {
    notFound();
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(getPortalCookieName(client))?.value;
  const [hasSession, isAdmin] = await Promise.all([
    hasValidSession(client, sessionCookie),
    isAdminSession(),
  ]);
  const isAuthorized = hasSession || isAdmin;

  if (!isAuthorized) {
    return <AccessGate clientSlug={client} />;
  }

  redirect(`/portal/${client}/app`);
}
