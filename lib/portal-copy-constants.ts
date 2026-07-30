// Global, cross-client portal copy -- edited once in /admin/content, applied
// to every client's portal. Distinct from per-engagement data (fee, dates,
// team) which lives in the `engagements` table instead.
//
// Template placeholders use {{variableName}} syntax and get substituted per
// client at render time -- e.g. {{engagementTitle}} or {{clientFirstName}}.
// Keys with no placeholders are just static global copy.

export type PortalCopyKey =
  | "welcome_subtitle"
  | "team_heading"
  | "team_subheading"
  | "whats_next_heading"
  | "whats_next_subheading"
  | "whats_next_step_1_title"
  | "whats_next_step_1_body"
  | "whats_next_step_2_title"
  | "whats_next_step_2_body"
  | "whats_next_step_3_title"
  | "whats_next_step_3_body"
  | "review_sign_heading"
  | "review_sign_subheading"
  | "sow_label"
  | "sow_description"
  | "msa_label"
  | "msa_description";

export const PORTAL_COPY_DEFAULTS: Record<PortalCopyKey, string> = {
  welcome_subtitle:
    "You're about to kick off {{engagementTitle}}. Here's who you'll be working with, what to expect, and everything you need to review and sign to get started.",
  team_heading: "Your team",
  team_subheading: "The people working on your account.",
  whats_next_heading: "What happens next",
  whats_next_subheading: "A quick look at the road ahead.",
  whats_next_step_1_title: "You sign below",
  whats_next_step_1_body:
    "Review and sign your Statement of Work and Master Services Agreement.",
  whats_next_step_2_title: "We schedule kickoff",
  whats_next_step_2_body:
    "Within 2 business days, we'll reach out to schedule your kickoff call and get you set up in our shared Slack channel.",
  whats_next_step_3_title: "Work begins",
  whats_next_step_3_body:
    "Your project timeline starts per the dates in your Statement of Work — you'll always know what's happening and when.",
  review_sign_heading: "Review & sign",
  review_sign_subheading: "Each document below is reviewed and signed separately.",
  sow_label: "Statement of Work",
  sow_description: "Scope, deliverables, timeline, and fees for this engagement.",
  msa_label: "Master Services Agreement",
  msa_description: "The general terms that govern this and future engagements.",
};

