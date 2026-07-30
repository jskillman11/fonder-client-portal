import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { getEngagement } from "@/lib/get-engagement";
import { buildSignableDocumentHtml } from "@/lib/pdf-template";

// Talks to a self-hosted Documenso instance to create, upload, and send a
// combined SOW + MSA document for the given client to sign. The PDF itself
// is generated fresh from the client's stored Markdown content at request
// time (via a small dedicated rendering service on Railway) -- there is no
// pre-uploaded static PDF anymore.
//
// Required environment variables (set these in Vercel, NOT in this file):
//   DOCUMENSO_URL           e.g. https://documenso-web-production-cf8d.up.railway.app
//   DOCUMENSO_API_KEY       the API token from Documenso's Settings > API Tokens
//   PDF_RENDER_SERVICE_URL  the Railway URL of the fonder-pdf-renderer service
//   PDF_RENDER_API_KEY      shared secret matching that service's RENDER_API_KEY

export async function POST(req: NextRequest) {
  const { clientSlug } = await req.json();
  const engagement = await getEngagement(clientSlug);

  if (!engagement) {
    return NextResponse.json({ error: "Unknown client" }, { status: 404 });
  }

  if (!engagement.sowContentMarkdown || !engagement.msaContentMarkdown) {
    return NextResponse.json(
      { error: "This client's SOW/MSA content hasn't been entered yet" },
      { status: 400 },
    );
  }

  const documensoUrl = process.env.DOCUMENSO_URL;
  const apiKey = process.env.DOCUMENSO_API_KEY;
  const renderServiceUrl = process.env.PDF_RENDER_SERVICE_URL;
  const renderApiKey = process.env.PDF_RENDER_API_KEY;

  if (!documensoUrl || !apiKey) {
    return NextResponse.json(
      { error: "Documenso is not configured (missing env vars)" },
      { status: 500 },
    );
  }
  if (!renderServiceUrl || !renderApiKey) {
    return NextResponse.json(
      { error: "PDF render service is not configured (missing env vars)" },
      { status: 500 },
    );
  }

  const authHeader = { Authorization: `Bearer ${apiKey}` };
  const base = documensoUrl.replace(/\/$/, "");

  try {
    // 0. Generate the PDF fresh from this client's stored Markdown content.
    const { html, headerHtml, footerHtml } = await buildSignableDocumentHtml({
      clientName: engagement.clientName,
      engagementTitle: engagement.engagementTitle,
      sowMarkdown: engagement.sowContentMarkdown,
      msaMarkdown: engagement.msaContentMarkdown,
      clientSignatoryName: engagement.clientSignatoryName,
      fonderSignatoryName: engagement.fonderSignatoryName,
    });

    const renderRes = await fetch(`${renderServiceUrl.replace(/\/$/, "")}/render`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": renderApiKey,
      },
      body: JSON.stringify({ html, headerHtml, footerHtml }),
    });

    if (!renderRes.ok) {
      const detail = await renderRes.text();
      return NextResponse.json(
        { error: "Failed to render the document PDF", detail },
        { status: 502 },
      );
    }

    const pdfBytes = Buffer.from(await renderRes.arrayBuffer());

    // Figure out how many pages this specific document turned out to be --
    // content length varies per client, so this can't be hardcoded the way
    // it could when every client shared one fixed static PDF.
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const lastPageNumber = pdfDoc.getPageCount();

    // 1. Create the document record and get an upload URL back.
    const createRes = await fetch(`${base}/api/v1/documents`, {
      method: "POST",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${engagement.clientName} x Fonder — ${engagement.engagementTitle}`,
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
          subject: `Please sign: ${engagement.engagementTitle}`,
          message:
            `Hi {signer.name}, please review and sign the Statement of Work and ` +
            `Master Services Agreement for ${engagement.engagementTitle}.`,
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

    // 2. Upload the generated PDF bytes.
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: new Uint8Array(pdfBytes),
    });

    if (!uploadRes.ok) {
      return NextResponse.json(
        { error: "Failed to upload document PDF to Documenso" },
        { status: 502 },
      );
    }

    // 2b. Place one signature field per recipient, both on the actual last
    // page of the generated document (where the combined signature block
    // lives) -- determined dynamically above, not hardcoded, since content
    // length now varies per client.
    type CreatedRecipient = { recipientId: number; email: string; name: string };
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
      { recipientId: clientRecipient.recipientId, pageY: 55 },
      { recipientId: fonderRecipient.recipientId, pageY: 75 },
    ];

    for (const placement of fieldPlacements) {
      const fieldRes = await fetch(
        `${base}/api/v1/documents/${documentId}/fields`,
        {
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
        },
      );

      if (!fieldRes.ok) {
        const detail = await fieldRes.text();
        return NextResponse.json(
          { error: "Failed to place a signature field", detail },
          { status: 502 },
        );
      }
    }

    // 3. Send it — this is what triggers Documenso's own email to the signers.
    const sendRes = await fetch(
      `${base}/api/v1/documents/${documentId}/send`,
      { method: "POST", headers: authHeader },
    );

    if (!sendRes.ok) {
      const detail = await sendRes.text();
      return NextResponse.json(
        { error: "Document created but failed to send", detail },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, documentId });
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected error generating or sending the document", detail: String(err) },
      { status: 500 },
    );
  }
}
