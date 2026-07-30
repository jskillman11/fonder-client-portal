import { NextResponse } from "next/server";
import { listCompanies, listClients } from "@/lib/companies-clients";

export const dynamic = "force-dynamic";

export async function GET() {
  const [companies, clients] = await Promise.all([listCompanies(), listClients()]);
  return NextResponse.json({ companies, clients });
}
