export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-[var(--color-border)] rounded-[var(--radius-card)] ${className}`}
    >
      {children}
    </div>
  );
}
