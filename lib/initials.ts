// Shared by every person-avatar fallback (staff, clients) -- up to two
// initials from a display name, e.g. "Tim Johnson" -> "TJ". Company logo
// fallbacks are a separate convention (a single brand-mark letter) and
// don't use this.
export function initialsFromName(name: string): string {
  const words = name.split(" ").filter(Boolean);
  const initials = words.slice(0, 2).map((w) => w.charAt(0).toUpperCase());
  return initials.join("") || "?";
}
