import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "@/app/App";
import { usePwaStore } from "@/stores/pwa-store";
import "@/index.css";

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    usePwaStore.getState().setHayActualizacion(true);
    usePwaStore.getState().setRecargarApp(() => () => void updateSW(true));
  },
  onOfflineReady() {
    usePwaStore.getState().setHayActualizacion(false);
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
