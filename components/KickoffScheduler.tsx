"use client";

import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";

export function KickoffScheduler({
  clientSlug,
  calLink,
  kickoffEarliestDate,
}: {
  clientSlug: string;
  calLink: string;
  kickoffEarliestDate: string | null;
}) {
  // Cal.com's booking calendar reads a `month` query param (format YYYY-MM)
  // to control which month it opens to by default. This is a soft default
  // only -- it does not prevent picking an earlier date; that would require
  // date-range limits configured on the event type itself, inside Cal.com.
  const month = kickoffEarliestDate ? kickoffEarliestDate.slice(0, 7) : undefined;

  useEffect(() => {
    let cancelled = false;

    (async function () {
      const cal = await getCalApi();
      if (cancelled) return;

      cal("on", {
        action: "bookingSuccessfulV2",
        callback: () => {
          fetch("/api/portal/mark-kickoff-booked", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientSlug }),
          }).catch(() => null);
        },
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
