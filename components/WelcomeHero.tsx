import Image from "next/image";
import { Card } from "./Card";

export function WelcomeHero({
  clientFirstName,
  clientName,
  clientLogoUrl,
  subtitle,
  closingParagraph,
  signoff,
}: {
  clientFirstName: string;
  clientName: string;
  clientLogoUrl?: string | null;
  subtitle: string;
  closingParagraph: string;
  signoff: string;
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
        Welcome to Fonder{clientFirstName ? `, ${clientFirstName}` : ""}
      </h1>
      <p className="text-[15px] text-[var(--color-muted)] max-w-md mx-auto mb-8 leading-relaxed">
        {subtitle}
      </p>
      <div className="max-w-lg mx-auto text-left border-t border-[var(--color-border)] pt-7">
        <p className="text-[14px] text-[var(--color-muted)] leading-relaxed italic">
          {closingParagraph}
        </p>
        <p className="text-[12px] font-semibold tracking-wide uppercase text-[var(--color-faint)] mt-3">
          {signoff}
        </p>
      </div>
    </Card>
  );
}
