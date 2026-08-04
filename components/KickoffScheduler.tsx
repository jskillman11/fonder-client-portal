"use client";

import { useEffect, useState } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { Card } from "./Card";

function formatStartTime(startTime: string): string {
  return new Date(startTime).toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function KickoffScheduler({
  clientSlug,
  calLink,
  kickoffEarliestDate,
  kickoffBooked,
  kickoffStartTime,
  onBooked,
}: {
  clientSlug: string;
  calLink: string;
  kickoffEarliestDate: string | null;
  kickoffBooked: boolean;
  kickoffStartTime: string | null;
  onBooked?: () => void;
}) {
  const [booked, setBooked] = useState(kickoffBooked);
  const [startTime, setStartTime] = useState(kickoffStartTime);

  // Cal.com's booking calendar reads a `month` query param (format YYYY-MM)
  // to control which month it opens to by default. This is a soft default
  // only -- it does not prevent picking an earlier date; that would require
  // date-range limits set on the event type itself, inside Cal.com.
  const month = kickoffEarliestDate ? kickoffEarliestDate.slice(0, 7) : undefined;

  useEffect(() => {
    if (booked) return;
    let cancelled = false;

    (async function () {
      const cal = await getCalApi();
      if (cancelled) return;

      cal("on", {
        action: "bookingSuccessfulV2",
        callback: (e) => {
          const newStartTime = e.detail.data.startTime ?? null;
          setBooked(true);
          setStartTime(newStartTime);
          onBooked?.();

          fetch("/api/portal/mark-kickoff-booked", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientSlug, startTime: newStartTime }),
          }).catch(() => null);
        },
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booked]);

  if (booked) {
    return (
      <Card className="px-5 py-4">
        <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">
          Meeting booked
        </p>
        <p className="text-[13.5px] text-[var(--color-muted-text)] mt-0.5">
          {startTime ? formatStartTime(startTime) : "Check your email for the details."}
        </p>
      </Card>
    );
  }

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
