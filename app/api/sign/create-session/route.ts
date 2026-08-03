import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { getEngagement } from "@/lib/get-engagement";
import { buildSingleDocumentHtml } from "@/lib/pdf-template";
import { createServiceClient } from "@/lib/supabase/server";

// Creates a SEPARATE Documenso document for just one of {sow, msa} -- these
// are now two fully independent signing events, not one combined session.
// Returns the client recipient's embed token, used to render Documenso's
// real signing UI directly inside our own page via an iframe
// (`{DOCUMENSO_URL}/embed/sign/{token}`) -- no email required for the client
// to actually sign, though Fonder's own send still fires in the background
// as a safe fallback in case the embed route expects the document to be in
// a "sent" state.

export async function POST(req: NextRequest) {
  const { clientSlug, docType } = await req.json();

  if (docType !== "sow" && docType !== "msa") {
    return NextResponse.json({ error: "docType must be 'sow' or 'msa'" }, { status: 400 });
  }

  const engagement = await getEngagement(clientSlug);
  if (!engagement) {
    return NextResponse.json({ error: "Unknown client" }, { status: 404 });
  }

  const markdown =
    docType === "sow" ? engagement.sowContentMarkdown : engagement.msaContentMarkdown;
  if (!markdown) {
    return NextResponse.json(
      { error: `This client's ${docType.toUpperCase()} content hasn't been entered yet` },
      { status: 400 },
    );
  }

  const documensoUrl = process.env.DOCUMENSO_URL;
  const apiKey = process.env.DOCUMENSO_API_KEY;
  const renderServiceUrl = process.env.PDF_RENDER_SERVICE_URL;
  const renderApiKey = process.env.PDF_RENDER_API_KEY;

  if (!documensoUrl || !apiKey) {
    return NextResponse.json({ error: "Documenso is not configured" }, { status: 500 });
  }
  if (!renderServiceUrl || !renderApiKey) {
    return NextResponse.json({ error: "PDF render service is not configured" }, { status: 500 });
  }

  const authHeader = { Authorization: `Bearer ${apiKey}` };
  const base = documensoUrl.replace(/\/$/, "");
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

    const renderRes = await fetch(`${renderServiceUrl.replace(/\/$/, "")}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": renderApiKey },
      body: JSON.stringify({ html, headerHtml, footerHtml }),
    });

    if (!renderRes.ok) {
      const detail = await renderRes.text();
      return NextResponse.json({ error: "Failed to render the PDF", detail }, { status: 502 });
    }

    const pdfBytes = Buffer.from(await renderRes.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const lastPageNumber = pdfDoc.getPageCount();

    const createRes = await fetch(`${base}/api/v1/documents`, {
      method: "POST",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${engagement.clientName} x Fonder — ${engagement.engagementTitle} (${docLabel})`,
        recipients: [
          {
            name: engagement.clientSignatoryName,
            email: engagement.clientSignatoryEmail,
            role: "SIGNER",
          },
          {
            name: engagement.fonderSignatoryName,
            email: engagement.fonderSignatoryEmail,
            role: "SIGNER",
          },
        ],
        meta: {
          subject: `Please sign: ${docLabel} — ${engagement.engagementTitle}`,
          message: `Hi {signer.name}, please review and sign the ${docLabel} for ${engagement.engagementTitle}.`,
        },
      }),
    });

    if (!createRes.ok) {
      const detail = await createRes.text();
      return NextResponse.json(
        { error: "Failed to create document in Documenso", detail },
        { status: 502 },
      );
    }

    const { uploadUrl, documentId, recipients } = await createRes.json();

    // Persist which Documenso document backs this doc type for this company,
    // and reset any prior signature -- a new session always supersedes it.
    // The completion webhook (app/api/webhooks/documenso) looks up by this
    // id to know which company/doc type actually finished signing.
    if (engagement.companyId) {
      const supabase = createServiceClient();
      const idColumn = docType === "sow" ? "sow_documenso_document_id" : "msa_documenso_document_id";
      const signedColumn = docType === "sow" ? "sow_signed_at" : "msa_signed_at";
      await supabase
        .from("companies")
        .update({ [idColumn]: String(documentId), [signedColumn]: null })
        .eq("id", engagement.companyId);
    }

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: new Uint8Array(pdfBytes),
    });

    if (!uploadRes.ok) {
      return NextResponse.json({ error: "Failed to upload PDF to Documenso" }, { status: 502 });
    }

    type CreatedRecipient = { recipientId: number; email: string; name: string; token: string };
    const clientRecipient = (recipients as CreatedRecipient[]).find(
      (r) => r.email === engagement.clientSignatoryEmail,
    );
    const fonderRecipient = (recipients as CreatedRecipient[]).find(
      (r) => r.email === engagement.fonderSignatoryEmail,
    );

    if (!clientRecipient || !fonderRecipient) {
      return NextResponse.json(
        { error: "Could not match recipients returned by Documenso" },
        { status: 502 },
      );
    }

    const fieldPlacements = [
      { recipientId: clientRecipient.recipientId, pageY: 60 },
      { recipientId: fonderRecipient.recipientId, pageY: 78 },
    ];

    for (const placement of fieldPlacements) {
      const fieldRes = await fetch(`${base}/api/v1/documents/${documentId}/fields`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: placement.recipientId,
          type: "SIGNATURE",
          pageNumber: lastPageNumber,
          pageX: 10,
          pageY: placement.pageY,
          pageWidth: 25,
          pageHeight: 4,
        }),
      });

      if (!fieldRes.ok) {
        const detail = await fieldRes.text();
        return NextResponse.json(
          { error: "Failed to place a signature field", detail },
          { status: 502 },
        );
      }
    }

    // Safe-fallback send -- see file header comment. Not treated as fatal if
    // it fails, since the embedded signing flow below doesn't depend on it.
    await fetch(`${base}/api/v1/documents/${documentId}/send`, {
      method: "POST",
      headers: authHeader,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      embedToken: clientRecipient.token,
      documensoUrl: base,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected error creating the signing session", detail: String(err) },
      { status: 500 },
    );
  }
}
