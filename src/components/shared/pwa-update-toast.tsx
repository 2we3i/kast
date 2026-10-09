import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "use-intl";

declare global {
  interface Window {
    __kastWaitingWorker?: ServiceWorker;
  }
}

const OFFLINE_NOTICE_KEY = "kast:offline-ready-shown";

/** Sends the waiting worker live, then reloads once it controls the page. */
function applyUpdate() {
  const worker = window.__kastWaitingWorker;
  if (!worker) return;
  navigator.serviceWorker.addEventListener(
    "controllerchange",
    () => window.location.reload(),
    { once: true },
  );
  worker.postMessage("kast:skip-waiting");
}

function offlineNoticeShown(): boolean {
  try {
    return localStorage.getItem(OFFLINE_NOTICE_KEY) !== null;
  } catch {
    return true;
  }
}

/**
 * Listens to the service worker events the head script dispatches: a one-time
 * "works offline" notice after the first install, and a reload prompt when a
 * new version is waiting. Nothing reloads without the user's click.
 */
export function PwaUpdateToast() {
  const t = useTranslations("pwa");

  useEffect(() => {
    const onUpdate = () =>
      toast(t("updateTitle"), {
        id: "kast-update",
        description: t("updateDescription"),
        duration: Number.POSITIVE_INFINITY,
        action: { label: t("updateAction"), onClick: applyUpdate },
      });
    const onReady = () => {
      if (offlineNoticeShown()) return;
      try {
        localStorage.setItem(OFFLINE_NOTICE_KEY, "1");
      } catch {
        // Storage blocked: the notice may show again, which is harmless.
      }
      toast.success(t("offlineReady"));
    };
    if (window.__kastWaitingWorker) onUpdate();
    window.addEventListener("kast:sw-update", onUpdate);
    window.addEventListener("kast:sw-ready", onReady);
    return () => {
      window.removeEventListener("kast:sw-update", onUpdate);
      window.removeEventListener("kast:sw-ready", onReady);
    };
  }, [t]);

  return null;
}
