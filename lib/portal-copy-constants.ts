// Global, cross-client portal copy -- edited once in /admin/content, applied
// to every client's portal. Distinct from per-engagement data (fee, dates,
// team, scope) which lives in the `engagements` table instead.
//
// Template placeholders use {{variableName}} syntax and get substituted per
// client at render time -- e.g. {{engagementTitle}} or {{clientFirstName}}.
// Keys with no placeholders are just static global copy.

export type PortalCopyKey =
  | "welcome_greeting"
  | "welcome_subtitle"
  | "overview_heading"
  | "overview_subheading"
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
  | "whats_next_step_4_title"
  | "whats_next_step_4_body"
  | "sow_label"
  | "sow_description"
  | "msa_label"
  | "msa_description";

export const PORTAL_COPY_DEFAULTS: Record<PortalCopyKey, string> = {
  welcome_greeting: "Welcome to Fonder, {{clientFirstName}}",
  welcome_subtitle:
    "You're about to kick off {{engagementTitle}}. Here's who you'll be working with, what to expect, and everything you need to review and sign to get started.",
  overview_heading: "Overview",
  overview_subheading: "A quick look at what we're doing together.",
  team_heading: "Your team",
  team_subheading: "The people working on your account.",
  whats_next_heading: "What happens next",
  whats_next_subheading: "A quick look at the road ahead.",
  whats_next_step_1_title: "Review & sign",
  whats_next_step_1_body:
    "Review and sign your Statement of Work and Master Services Agreement below.",
  whats_next_step_2_title: "Invoice & deposit",
  whats_next_step_2_body:
    "Once signed, you'll receive an invoice for your project deposit — this secures your spot and kicks off scheduling.",
  whats_next_step_3_title: "Schedule your kickoff",
  whats_next_step_3_body: "Pick a time below that works for you.",
  whats_next_step_4_title: "Access your client portal",
  whats_next_step_4_body:
    "Log in anytime to see project status, tasks, deliverables, and more.",
  sow_label: "Statement of Work",
  sow_description: "Scope, deliverables, timeline, and fees for this engagement.",
  msa_label: "Master Services Agreement",
  msa_description: "The general terms that govern this and future engagements.",
};
