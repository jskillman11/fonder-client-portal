import Image from "next/image";
import { Card } from "./Card";

export function WelcomeHero({
  clientName,
  engagementTitle,
  clientLogoUrl,
}: {
  clientName: string;
  engagementTitle: string;
  clientLogoUrl?: string | null;
}) {
  return (
    <Card className="px-9 py-10 md:px-12 md:py-12 text-center">
      <div className="flex items-center justify-center gap-4 mb-8">
        <Image
          src="/fonder-logo.png"
          alt="Fonder"
          width={140}
          height={32}
          className="h-8 w-auto"
        />
        {clientLogoUrl && (
          <>
            <span className="text-[20px] text-[var(--color-border)] font-light">
              ×
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={clientLogoUrl}
              alt={clientName}
              className="h-8 w-auto max-w-[140px] object-contain"
            />
          </>
        )}
      </div>
      <h1 className="text-[26px] md:text-[30px] font-bold tracking-tight text-[var(--color-ink)] mb-3">
        Welcome to Fonder, {clientName}
      </h1>
      <p className="text-[15px] text-[var(--color-muted)] max-w-md mx-auto mb-8 leading-relaxed">
        You&apos;re about to kick off {engagementTitle}. Here&apos;s who
        you&apos;ll be working with, what to expect, and everything you need
        to review and sign to get started.
      </p>
      <div className="max-w-lg mx-auto text-left border-t border-[var(--color-border)] pt-7">
        <p className="text-[14px] text-[var(--color-muted)] leading-relaxed italic">
          At Fonder Studio, we approach every project as a creative
          partnership built on trust, clarity, and shared ambition —
          senior-level thinkers and makers collaborating directly with you.
          Thank you for trusting us with this work; we&apos;re honored to be
          your partner and excited to build something meaningful together.
        </p>
        <p className="text-[12px] font-semibold tracking-wide uppercase text-[var(--color-faint)] mt-3">
          — The Fonder Studio Team
        </p>
      </div>
    </Card>
  );
}
