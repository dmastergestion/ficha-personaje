import { Link } from "react-router-dom";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { cn } from "@/lib/utils";

interface LayoutProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  wide?: boolean;
}

export function Layout({ title, children, actions, wide = false }: LayoutProps) {
  return (
    <div
      className={`mx-auto flex min-h-screen flex-col px-4 py-5 sm:px-6 ${wide ? "max-w-[90rem]" : "max-w-5xl"}`}
    >
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>D&D 2024 · SRD</span>
            <OfflineIndicator />
          </p>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <nav className="flex flex-wrap gap-2">
          <Link
            to="/"
            className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            Personajes
          </Link>
          <Link
            to="/settings"
            className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
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

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "critical" | "ghost";
}

export function Button({
  className,
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-lg px-4 py-2 text-sm transition disabled:opacity-50",
        variant === "critical" && "bg-gold font-semibold text-black hover:bg-yellow-300",
        variant === "default" && "border border-white/10 hover:bg-white/5",
        variant === "ghost" && "text-muted hover:text-white",
        className,
      )}
      {...props}
    />
  );
}
