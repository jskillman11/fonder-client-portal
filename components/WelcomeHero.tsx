import Image from "next/image";
import { Card } from "./Card";

export function WelcomeHero({
  greeting,
  subtitle,
}: {
  greeting: string;
  subtitle: string;
}) {
  return (
    <Card className="px-9 py-10 md:px-12 md:py-12 text-center">
      <div className="flex items-center justify-center mb-8">
        <Image
          src="/fonder-logo.png"
          alt="Fonder"
          width={140}
          height={32}
          className="h-8 w-auto"
        />
      </div>
      <h1 className="text-[26px] md:text-[30px] font-bold tracking-tight text-[var(--color-ink)] mb-3">
        {greeting}
      </h1>
      <p className="text-[15px] text-[var(--color-muted-text)] max-w-md mx-auto leading-relaxed">
        {subtitle}
      </p>
    </Card>
  );
}
