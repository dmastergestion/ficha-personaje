import { Link, type LinkProps } from "react-router-dom";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { cn } from "@/lib/utils";

interface LayoutProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  overflow?: React.ReactNode;
  chrome?: "default" | "sheet";
  wide?: boolean;
  status?: React.ReactNode;
}

export function Layout({
  title,
  subtitle,
  children,
  actions,
  overflow,
  chrome = "default",
  wide = false,
  status,
}: LayoutProps) {
  const compact = chrome === "sheet" || wide;
  return (
    <div
      className={cn(
        "mx-auto flex min-h-screen flex-col px-4 sm:px-6",
        wide ? "max-w-[90rem] py-3" : "max-w-5xl py-5",
      )}
    >
      <header
        className={cn(
          "flex flex-wrap items-center justify-between border-b border-white/10",
          wide ? "mb-3 gap-2 pb-2.5" : "mb-6 gap-3 pb-4",
        )}
      >
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>D&D 2024 · PHB</span>
            <OfflineIndicator />
            {status}
          </p>
          <h1 className={cn("truncate font-bold text-cream", wide ? "text-xl leading-tight" : "text-2xl")}>
            {title}
          </h1>
          {subtitle ? <div className={cn("min-w-0", wide ? "mt-1.5" : "mt-2")}>{subtitle}</div> : null}
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Link
            to="/"
            className={buttonClassName(
              "default",
              compact ? "inline-flex px-2.5 py-1.5 text-sm" : "inline-flex px-3 py-2",
            )}
          >
            Personajes
          </Link>
          {chrome !== "sheet" && (
            <Link
              to="/settings"
              className={buttonClassName(
                "default",
                compact ? "inline-flex px-2.5 py-1.5 text-sm" : "inline-flex px-3 py-2",
              )}
            >
              Ajustes
            </Link>
          )}
          {actions}
          {(chrome === "sheet" || overflow) && (
            <details className="sheet-overflow-menu">
              <summary
                className={buttonClassName(
                  "default",
                  compact ? "cursor-pointer px-2.5 py-1.5 text-sm" : "cursor-pointer px-3 py-2",
                )}
                aria-label="Más acciones"
              >
                ⋯
              </summary>
              <div className="absolute right-0 z-50 mt-1 flex min-w-[10rem] flex-col gap-1 rounded-xl border border-white/10 bg-elevated p-1.5 shadow-lg">
                {chrome === "sheet" && (
                  <Link
                    to="/settings"
                    className={buttonClassName("ghost", "w-full justify-start px-3 py-1.5 text-sm")}
                  >
                    Ajustes
                  </Link>
                )}
                {overflow}
              </div>
            </details>
          )}
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
  | "success"
  | "combat";

export function buttonClassName(variant: ButtonVariant = "default", className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    "disabled:pointer-events-none disabled:opacity-50",
    variant === "primary" && "bg-accent font-semibold text-ink hover:bg-accent-hover",
    variant === "default" && "border border-white/10 text-cream hover:bg-white/5",
    variant === "ghost" && "text-muted hover:bg-white/5 hover:text-cream",
    variant === "danger" &&
      "border border-danger/40 bg-danger/15 text-danger hover:bg-danger/25",
    variant === "success" &&
      "border border-success/40 bg-success/15 text-success hover:bg-success/25",
    variant === "combat" &&
      "border border-white/20 bg-elevated font-medium text-cream hover:border-white/30 hover:bg-white/10",
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
