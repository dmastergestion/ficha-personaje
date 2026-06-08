import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineIndicator() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <span className="rounded-full bg-red-900/60 px-2 py-0.5 text-xs text-red-200">
      Sin conexión · datos locales
    </span>
  );
}
