import { redirect } from "next/navigation";

// Onboarding was folded into Home -- this route only exists as a fallback
// for any stale bookmark/browser-history link still pointing here.
export default async function OnboardingTabRedirect({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  redirect(`/portal/${client}/app/home`);
}
