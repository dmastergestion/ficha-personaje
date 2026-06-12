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
  labelPrefix,
  labelAddon,
  value,
  sub,
  trailing,
  accent,
}: {
  label: string;
  labelPrefix?: React.ReactNode;
  labelAddon?: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  trailing?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={cn("sheet-stat-pill", accent && "sheet-stat-pill-accent")}>
      <span className="sheet-stat-pill-label inline-flex items-center gap-1">
        {labelPrefix}
        {label}
        {labelAddon}
      </span>
      <div className="sheet-stat-pill-body">
        <span className="sheet-stat-pill-value">{value}</span>
        {sub && <span className="sheet-stat-pill-sub">{sub}</span>}
        {trailing}
      </div>
    </div>
  );
}
