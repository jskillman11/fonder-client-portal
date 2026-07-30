// Client-specific engagement data. One file like this per client, keyed by slug,
// keeps the portal itself fully generic — swap in a new client by adding a new entry.

export type TeamMember = {
  name: string;
  role: string;
  blurb?: string;
};

export type EngagementData = {
  clientSlug: string;
  clientName: string;
  engagementTitle: string;
  totalFee: string;
  finalDeliveryDate: string;
  team: TeamMember[];
  documents: {
    label: string;
    description: string;
  }[];
  // Needed to actually send the document for signature via Documenso.
  clientSignatoryName: string;
  clientSignatoryEmail: string;
  fonderSignatoryName: string;
  fonderSignatoryEmail: string;
  // Path (relative to /documents) to the final, client-approved SOW+MSA PDF,
  // merged into one file. This must be the FINAL signed-ready version —
  // not a draft — since this is what actually gets sent for signature.
  documentPdfPath: string;
};

export const engagements: Record<string, EngagementData> = {
  coros: {
    clientSlug: "coros",
    clientName: "Coros",
    engagementTitle: "Dura 2 Software Storytelling System",
    totalFee: "$12,000",
    finalDeliveryDate: "August 30, 2026",
    team: [
      { name: "Tom Abrams", role: "Founder, Creative Director" },
      { name: "Josh Block", role: "Co-Founder, Design Director" },
      { name: "Jourden Skillman", role: "Co-Founder, Operations" },
      { name: "Jackson Roberts", role: "Head of Brand Growth" },
    ],
    documents: [
      {
        label: "Statement of Work",
        description:
          "Scope, deliverables, timeline, and fees for the Dura 2 Software Storytelling System.",
      },
      {
        label: "Master Services Agreement",
        description:
          "The general terms that govern this and future engagements between Fonder and Coros.",
      },
    ],
    // TODO(jourden): replace with the real Coros signatory's name and email —
    // Documenso needs an actual email address to send the signing request to.
    clientSignatoryName: "[Client Signatory Name]",
    clientSignatoryEmail: "TODO@coros.example",
    fonderSignatoryName: "Tom Abrams",
    fonderSignatoryEmail: "tom@fonder.studio",
    // TODO(jourden): drop the final, client-approved SOW+MSA PDF (merged into
    // one file) into /documents/coros-sow-msa.pdf before this can send for real.
    documentPdfPath: "coros-sow-msa.pdf",
  },
};
