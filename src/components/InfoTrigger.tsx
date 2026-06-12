import { useCallback, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FloatingInfoModal } from "@/components/FloatingInfoModal";
import { cn } from "@/lib/utils";

export function InfoTrigger({
  tip,
  title,
  panel,
  children,
  className,
  tipPlacement = "top",
}: {
  tip: string;
  title: string;
  panel: ReactNode;
  children?: ReactNode;
  className?: string;
  /** top = encima del botón; bottom = debajo (mejor en barras superiores recortadas). */
  tipPlacement?: "top" | "bottom";
}) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [tipStyle, setTipStyle] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const syncTipPosition = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTipStyle({
      top: tipPlacement === "bottom" ? rect.bottom + 8 : rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  }, [tipPlacement]);

  const showTip = hover && !!tip && tipStyle;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={cn(
          "relative inline-flex cursor-help items-center justify-center text-muted hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
          className,
        )}
        aria-label={`Información: ${title}`}
        onMouseEnter={() => {
          syncTipPosition();
          setHover(true);
        }}
        onMouseLeave={() => setHover(false)}
        onFocus={() => {
          syncTipPosition();
          setHover(true);
        }}
        onBlur={() => setHover(false)}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setHover(false);
          setOpen(true);
        }}
      >
        {children ?? <span className="text-sm leading-none" aria-hidden>ℹ</span>}
      </button>
      {showTip &&
        createPortal(
          <span
            role="tooltip"
            className="pointer-events-none fixed z-[200] w-max max-w-[18rem] rounded-lg border border-white/10 bg-elevated px-2.5 py-1.5 text-left text-xs leading-snug text-white shadow-lg"
            style={{
              top: tipStyle.top,
              left: tipStyle.left,
              transform:
                tipPlacement === "bottom"
                  ? "translate(-50%, 0)"
                  : "translate(-50%, -100%)",
            }}
          >
            {tip}
          </span>,
          document.body,
        )}
      {open
        ? createPortal(
            <FloatingInfoModal title={title} onClose={() => setOpen(false)}>
              {panel}
            </FloatingInfoModal>,
            document.body,
          )
        : null}
    </>
  );
}
