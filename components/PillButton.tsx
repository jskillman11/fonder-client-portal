export function PillButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
}) {
  const base =
    "inline-flex items-center justify-center rounded-[var(--radius-pill)] px-6 py-3 text-[13.5px] font-semibold transition-opacity hover:opacity-90";
  const styles =
    variant === "primary"
      ? "bg-[var(--color-ink)] text-white"
      : "bg-transparent text-[var(--color-ink)] border border-[var(--color-border)]";

  return (
    <button type={type} onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}
