import { NextRequest, NextResponse } from "next/server";
import { getEngagement } from "@/lib/get-engagement";
import { buildSingleDocumentHtml } from "@/lib/pdf-template";
import { createServiceClient } from "@/lib/supabase/server";

// Creates a SEPARATE DocuSeal submission for just one of {sow, msa} -- these
// are two fully independent signing events. Returns the client submitter's
// embed_src, used to render DocuSeal's real signing UI directly inside our
// own page via @docuseal/react's <DocusealForm> -- no email required for
// the client to actually sign; Fonder's own signatory still gets DocuSeal's
// default email invite to sign their part.
//
// No PDF rendering or coordinate placement needed here (unlike the old
// Documenso integration) -- DocuSeal converts the HTML to a PDF itself, and
// signature/date fields are placed via inline tags in the HTML (see
// lib/pdf-template.ts's signatureBlockHtml).

export async function POST(req: NextRequest) {
  const { clientSlug, docType } = await req.json();

  if (docType !== "sow" && docType !== "msa") {
    return NextResponse.json({ error: "docType must be 'sow' or 'msa'" }, { status: 400 });
  }

  const engagement = await getEngagement(clientSlug);
  if (!engagement) {
    return NextResponse.json({ error: "Unknown client" }, { status: 404 });
  }
  if (!engagement.companyId) {
    return NextResponse.json({ error: "This client isn't linked to a company" }, { status: 400 });
  }

  const markdown =
    docType === "sow" ? engagement.sowContentMarkdown : engagement.msaContentMarkdown;
  if (!markdown) {
    return NextResponse.json(
      { error: `This client's ${docType.toUpperCase()} content hasn't been entered yet` },
      { status: 400 },
    );
  }

  const apiKey = process.env.DOCUSEAL_API_KEY;
  const apiUrl = (process.env.DOCUSEAL_API_URL || "https://api.docuseal.com").replace(/\/$/, "");

  if (!apiKey) {
    return NextResponse.json({ error: "DocuSeal is not configured" }, { status: 500 });
  }

  const docLabel = docType === "sow" ? "Statement of Work" : "Master Services Agreement";

  try {
    const { html, headerHtml, footerHtml } = await buildSingleDocumentHtml({
      clientName: engagement.clientName,
      engagementTitle: engagement.engagementTitle,
      docType,
      markdown,
      clientSignatoryName: engagement.clientSignatoryName,
      fonderSignatoryName: engagement.fonderSignatoryName,
    });

    // A new session always supersedes any prior signature for this doc type.
    // Engagement-scoped (per-contract), not company-scoped.
    const supabase = createServiceClient();
    const signedColumn = docType === "sow" ? "sow_signed_at" : "msa_signed_at";
    await supabase
      .from("engagements")
      .update({ [signedColumn]: null })
      .eq("id", engagement.id);

    // Encodes which company/doc type this submission is for -- echoed back
    // verbatim on every submitter in the completion webhook, so matching it
    // back to a company needs no stored id-mapping column or DB lookup.
    const externalId = `${engagement.companyId}:${docType}`;

    const createRes = await fetch(`${apiUrl}/submissions/html`, {
      method: "POST",
      headers: { "X-Auth-Token": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [
          {
            name: `${engagement.clientName} x Fonder — ${engagement.engagementTitle} (${docLabel})`,
            html,
            html_header: headerHtml,
            html_footer: footerHtml,
          },
        ],
        submitters: [
          {
            role: "Client",
            name: engagement.clientSignatoryName,
            email: engagement.clientSignatoryEmail,
            external_id: externalId,
            send_email: false,
          },
          {
            role: "Fonder",
            name: engagement.fonderSignatoryName,
            email: engagement.fonderSignatoryEmail,
            external_id: externalId,
          },
        ],
        order: "random",
      }),
    });

    if (!createRes.ok) {
      const detail = await createRes.text();
      return NextResponse.json(
        { error: "Failed to create submission in DocuSeal", detail },
        { status: 502 },
      );
    }

    const created = await createRes.json();
    type CreatedSubmitter = { role: string; email: string; embed_src: string };
    const clientSubmitter = (created.submitters as CreatedSubmitter[]).find(
      (s) => s.role === "Client",
    );

    if (!clientSubmitter) {
      return NextResponse.json(
        { error: "Could not find the client submitter in DocuSeal's response" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      embedSrc: clientSubmitter.embed_src,
      submitterEmail: clientSubmitter.email,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected error creating the signing session", detail: String(err) },
      { status: 500 },
    );
  }
}
