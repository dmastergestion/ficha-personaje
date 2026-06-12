import { Link, type LinkProps } from "react-router-dom";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { cn } from "@/lib/utils";

interface LayoutProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  wide?: boolean;
  status?: React.ReactNode;
}

export function Layout({ title, subtitle, children, actions, wide = false, status }: LayoutProps) {
  return (
    <div
      className={`mx-auto flex min-h-screen flex-col px-4 py-5 sm:px-6 ${wide ? "max-w-[90rem]" : "max-w-5xl"}`}
    >
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>D&D 2024 · SRD</span>
            <OfflineIndicator />
            {status}
          </p>
          <h1 className="truncate text-2xl font-bold">{title}</h1>
          {subtitle ? <div className="mt-2 min-w-0">{subtitle}</div> : null}
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Link
            to="/"
            className={buttonClassName("default", "inline-flex px-3 py-2")}
          >
            Personajes
          </Link>
          <Link
            to="/settings"
            className={buttonClassName("default", "inline-flex px-3 py-2")}
          >
            Ajustes
          </Link>
          {actions}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

export type ButtonVariant =
  | "default"
  | "primary"
  | "ghost"
  | "danger"
  | "combat"
  /** @deprecated Usa `primary` */
  | "critical";

export function buttonClassName(variant: ButtonVariant = "default", className?: string) {
  const resolved = variant === "critical" ? "primary" : variant;
  return cn(
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    "disabled:pointer-events-none disabled:opacity-50",
    resolved === "primary" && "bg-gold font-semibold text-black hover:bg-yellow-300",
    resolved === "default" && "border border-white/10 hover:bg-white/5",
    resolved === "ghost" && "text-muted hover:bg-white/5 hover:text-white",
    resolved === "danger" &&
      "border border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20",
    resolved === "combat" &&
      "border border-white/20 bg-elevated font-medium hover:border-white/30 hover:bg-white/10",
    className,
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, className)} {...props} />;
}

export function LinkButton({
  to,
  variant = "default",
  className,
  children,
  ...props
}: LinkProps & { variant?: ButtonVariant; className?: string; children: React.ReactNode }) {
  return (
    <Link to={to} className={buttonClassName(variant, className)} {...props}>
      {children}
    </Link>
  );
}
