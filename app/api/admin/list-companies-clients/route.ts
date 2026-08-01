import { NextResponse } from "next/server";
import { listCompanies, listClients } from "@/lib/companies-clients";
import { requireAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const [companies, clients] = await Promise.all([listCompanies(), listClients()]);
  return NextResponse.json({ companies, clients });
}
