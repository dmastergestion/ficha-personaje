import { useEffect, useState } from "react";
import { Button } from "@/components/layout";
import { tu } from "@/rules/srd";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (hidden || !deferred) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/40 bg-panel px-4 py-3">
      <p className="text-sm">{tu("installHint")}</p>
      <div className="flex gap-2">
        <Button
          variant="critical"
          onClick={() => {
            void deferred.prompt();
            setHidden(true);
          }}
        >
          Instalar
        </Button>
        <Button variant="ghost" onClick={() => setHidden(true)}>
          Ahora no
        </Button>
      </div>
    </div>
  );
}
