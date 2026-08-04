import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, hasPortalAccess } from "@/lib/supabase/server";
import { getEngagementPdfBytes } from "@/lib/get-engagement";

// Streams a signed SOW/MSA PDF from the (private) engagement-documents
// bucket. Gated the same way every other portal route is: hasPortalAccess
// covers "does this session have current access to this clientSlug at
// all" (staff always pass; a client passes if their profile.client_id
// matches); the extra company_id check below covers a HISTORICAL
// engagement that may not be the one hasPortalAccess itself resolved.
export async function GET(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ clientSlug: string; engagementId: string; docType: string }> },
) {
  const { clientSlug, engagementId, docType } = await params;

  if (docType !== "sow" && docType !== "msa") {
    return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
  }

  const { authorized } = await hasPortalAccess(clientSlug);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("client_slug", clientSlug)
    .maybeSingle();

  if (!company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: engagement } = await supabase
    .from("engagements")
    .select("company_id, sow_signed_document_path, msa_signed_document_path")
    .eq("id", engagementId)
    .maybeSingle();

  if (!engagement || engagement.company_id !== company.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const path =
    docType === "sow" ? engagement.sow_signed_document_path : engagement.msa_signed_document_path;
  if (!path) {
    return NextResponse.json({ error: "Document not available" }, { status: 404 });
  }

  const bytes = await getEngagementPdfBytes(path);

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${docType}.pdf"`,
    },
  });
}
