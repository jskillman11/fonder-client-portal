import Image from "next/image";
import { Card } from "./Card";

export function Confirmation({ clientName }: { clientName: string }) {
  return (
    <Card className="px-9 py-12 md:px-12 md:py-14 text-center">
      <Image
        src="/fonder-logo.png"
        alt="Fonder"
        width={140}
        height={32}
        className="mx-auto mb-8 h-8 w-auto"
      />
      <div className="w-12 h-12 rounded-full bg-[var(--color-cream)] border border-[var(--color-border)] mx-auto mb-6 flex items-center justify-center">
        <span className="text-[20px] text-[var(--color-ink)]">✓</span>
      </div>
      <h1 className="text-[24px] font-bold text-[var(--color-ink)] mb-3">
        You&apos;re all set, {clientName}
      </h1>
      <p className="text-[15px] text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed mb-2">
        Your Statement of Work and Master Services Agreement are signed and
        on file. A copy is on its way to your inbox.
      </p>
      <p className="text-[15px] text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed">
        We&apos;ll be in touch within 2 business days to schedule kickoff.
        We&apos;re excited to get started.
      </p>
    </Card>
  );
}
