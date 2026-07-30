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
};

export const engagements: Record<string, EngagementData> = {
  coros: {
    clientSlug: "coros",
    clientName: "Coros",
    engagementTitle: "Dura 2 Software Storytelling System",
    totalFee: "$12,000",
    finalDeliveryDate: "August 30, 2026",
    team: [
      {
        name: "Tom Abrams",
        role: "Fonder Studio",
        // TODO(jourden): add the rest of the Coros account team here —
        // { name: "...", role: "...", blurb: "..." }
      },
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
  },
};
