import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { engagements } from "@/lib/engagements";

// Talks to a self-hosted Documenso instance to create, upload, and send a
// combined SOW + MSA document for the given client to sign.
//
// Required environment variables (set these in Vercel, NOT in this file):
//   DOCUMENSO_URL      e.g. https://documenso-web-production-cf8d.up.railway.app
//   DOCUMENSO_API_KEY  the API token generated inside Documenso's Settings > API Tokens

export async function POST(req: NextRequest) {
  const { clientSlug } = await req.json();
  const engagement = engagements[clientSlug];

  if (!engagement) {
    return NextResponse.json({ error: "Unknown client" }, { status: 404 });
  }

  const documensoUrl = process.env.DOCUMENSO_URL;
  const apiKey = process.env.DOCUMENSO_API_KEY;

  if (!documensoUrl || !apiKey) {
    return NextResponse.json(
      { error: "Documenso is not configured (missing env vars)" },
      { status: 500 },
    );
  }

  const authHeader = { Authorization: `Bearer ${apiKey}` };
  const base = documensoUrl.replace(/\/$/, "");

  try {
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

    // 2. Upload the actual PDF bytes.
    const pdfPath = path.join(
      process.cwd(),
      "documents",
      engagement.documentPdfPath,
    );
    const pdfBytes = await fs.readFile(pdfPath);

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: pdfBytes,
    });

    if (!uploadRes.ok) {
      return NextResponse.json(
        { error: "Failed to upload document PDF to Documenso" },
        { status: 502 },
      );
    }

    // 2b. Place a signature field for each recipient on both signature pages —
    // page 4 (end of the SOW) and page 7 (end of the MSA), since this PDF is
    // two merged documents, each with its own signature block. Position is a
    // reasonable estimate (bottom-left quadrant, stacked) — not pixel-matched
    // to the drawn lines in the PDF itself, since Documenso's field is an
    // interactive overlay, not something that needs to sit exactly on top of
    // the static artwork underneath it.
    type CreatedRecipient = {
      recipientId: number;
      email: string;
      name: string;
    };
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
      { recipientId: clientRecipient.recipientId, pageNumber: 4, pageY: 68 },
      { recipientId: fonderRecipient.recipientId, pageNumber: 4, pageY: 83 },
      { recipientId: clientRecipient.recipientId, pageNumber: 7, pageY: 55 },
      { recipientId: fonderRecipient.recipientId, pageNumber: 7, pageY: 70 },
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
            pageNumber: placement.pageNumber,
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
      { error: "Unexpected error contacting Documenso", detail: String(err) },
      { status: 500 },
    );
  }
}
