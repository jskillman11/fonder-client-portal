"use client";

import Cal from "@calcom/embed-react";

export function KickoffScheduler({
  calLink,
  kickoffEarliestDate,
}: {
  calLink: string;
  kickoffEarliestDate: string | null;
}) {
  // Cal.com's booking calendar reads a `month` query param (format YYYY-MM)
  // to control which month it opens to by default. This is a soft default
  // only -- it does not prevent picking an earlier date; that would require
  // date-range limits configured on the event type itself, inside Cal.com.
  const month = kickoffEarliestDate ? kickoffEarliestDate.slice(0, 7) : undefined;

  return (
    <div className="rounded-[14px] overflow-hidden border border-[var(--color-border)]">
      <Cal
        calLink={calLink}
        config={month ? { month } : undefined}
        style={{ width: "100%", height: "600px", overflow: "scroll" }}
      />
    </div>
  );
}
