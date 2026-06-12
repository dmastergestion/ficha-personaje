import { cn } from "@/lib/utils";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        status === "saving" && "bg-white/5 text-muted",
        status === "saved" && "bg-green-500/15 text-green-300",
        status === "error" && "bg-red-500/15 text-red-300",
      )}
      role="status"
      aria-live="polite"
    >
      {status === "saving" && "Guardando…"}
      {status === "saved" && "Guardado"}
      {status === "error" && "Error al guardar"}
    </span>
  );
}
