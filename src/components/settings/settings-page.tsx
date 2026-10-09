import { useTranslations } from "use-intl";
import { PlatformShell } from "@/components/platform/platform-shell";
import { AppProviders, type IslandProps } from "@/components/shared/providers";
import { SettingsAi } from "./settings-ai";
import { SettingsAppearance } from "./settings-appearance";
import { SettingsData } from "./settings-data";
import { SettingsOffline } from "./settings-offline";

export function SettingsPage(props: IslandProps) {
  return (
    <AppProviders locale={props.locale} pathname={props.pathname}>
      <PlatformShell>
        <SettingsContent />
      </PlatformShell>
    </AppProviders>
  );
}

function SettingsContent() {
  const t = useTranslations("settings");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
      <header className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </header>
      <SettingsAppearance />
      <SettingsAi />
      <SettingsData />
      <SettingsOffline />
    </div>
  );
}
