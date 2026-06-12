import type { ReactNode } from "react";
import { Button } from "@/components/layout";

export function FloatingInfoModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="floating-info-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-white/10 bg-panel shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-2 border-b border-white/10 px-4 py-3">
          <h2 id="floating-info-title" className="text-lg font-bold text-gold">
            {title}
          </h2>
          <Button variant="ghost" className="shrink-0 px-2 text-sm" onClick={onClose}>
            Cerrar
          </Button>
        </header>
        <div className="overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </div>
  );
}
