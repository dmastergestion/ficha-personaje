import { cn } from "@/lib/utils";

export function SheetCard({
  title,
  children,
  className,
  id,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("sheet-card", className)}>
      {title && <h3 className="sheet-section-title">{title}</h3>}
      {children}
    </section>
  );
}

export function SheetLabel({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <span className={cn("sheet-field-label", className)} {...(htmlFor ? { id: `${htmlFor}-label` } : {})}>
      {children}
    </span>
  );
}

export function StatPill({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("sheet-stat-pill", accent && "sheet-stat-pill-accent")}>
      <span className="sheet-stat-pill-label">{label}</span>
      <span className="sheet-stat-pill-value">{value}</span>
      {sub && <span className="sheet-stat-pill-sub">{sub}</span>}
    </div>
  );
}
