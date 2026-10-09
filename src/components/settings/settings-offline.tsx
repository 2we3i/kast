import {
  CheckCircleIcon,
  DownloadSimpleIcon,
  WifiSlashIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { SettingsSection } from "./settings-section";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

declare global {
  interface Window {
    __kastInstallPrompt?: InstallPromptEvent;
  }
}

type OfflineState = "ready" | "preparing" | "unsupported";

function readOfflineState(): OfflineState {
  if (!("serviceWorker" in navigator)) return "unsupported";
  return navigator.serviceWorker.controller ? "ready" : "preparing";
}

/** Tracks the service worker taking control of this page. */
function useOfflineState(): OfflineState | null {
  const [state, setState] = useState<OfflineState | null>(null);
  useEffect(() => {
    setState(readOfflineState());
    if (!("serviceWorker" in navigator)) return;
    const update = () => setState(readOfflineState());
    navigator.serviceWorker.addEventListener("controllerchange", update);
    window.addEventListener("kast:sw-ready", update);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", update);
      window.removeEventListener("kast:sw-ready", update);
    };
  }, []);
  return state;
}

/** The browser's offer to install Kast as an app, once it makes one. */
function useInstallPrompt(): InstallPromptEvent | null {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  useEffect(() => {
    const read = () => setPrompt(window.__kastInstallPrompt ?? null);
    read();
    window.addEventListener("kast:install-available", read);
    return () => window.removeEventListener("kast:install-available", read);
  }, []);
  return prompt;
}

const STATE_ICON = {
  ready: CheckCircleIcon,
  preparing: Spinner,
  unsupported: WifiSlashIcon,
} as const;

/** Offline readiness and the browser's install prompt. */
export function SettingsOffline() {
  const t = useTranslations("settings.offline");
  const state = useOfflineState();
  const prompt = useInstallPrompt();
  if (!state) return null;
  const Icon = STATE_ICON[state];

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    window.__kastInstallPrompt = undefined;
  }

  return (
    <SettingsSection id="offline" title={t("heading")}>
      <p className="flex items-center gap-2 text-sm">
        <Icon className="size-4 text-muted-foreground" />
        {t(state)}
      </p>
      {prompt && (
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-fit"
            onClick={() => void install()}
          >
            <DownloadSimpleIcon /> {t("install")}
          </Button>
          <FieldDescription>{t("installHint")}</FieldDescription>
        </div>
      )}
    </SettingsSection>
  );
}
