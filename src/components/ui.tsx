import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "seat";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-ink text-paper hover:bg-brass-deep disabled:opacity-50",
    secondary:
      "bg-white/80 text-ink border border-line hover:bg-paper-deep",
    ghost: "bg-transparent text-ink hover:bg-white/60",
    danger: "bg-seat-taken text-white hover:brightness-95",
    seat: "bg-seat-free text-white",
  };

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold tracking-wide uppercase transition active:scale-[0.98]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-ink outline-none focus:border-brass",
        className,
      )}
      {...props}
    />
  );
}

export function Screen({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto min-h-screen w-full max-w-5xl px-4 py-5 sm:px-6", className)}>
      {children}
    </div>
  );
}

export function TopBar({
  title,
  onBack,
  actions,
}: {
  title: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {onBack ? (
          <Button variant="secondary" className="px-4" onClick={onBack}>
            Back
          </Button>
        ) : null}
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl leading-tight text-ink sm:text-3xl">
          {title}
        </h1>
      </div>
      {actions}
    </div>
  );
}

export function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-3xl border border-line bg-white/70 p-4 shadow-[var(--shadow)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-fraunces)] text-3xl">{value}</p>
    </div>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <button className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-[28px] bg-paper p-5 shadow-[var(--shadow)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-fraunces)] text-2xl">{title}</h2>
          <Button variant="ghost" className="px-3 py-2" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
