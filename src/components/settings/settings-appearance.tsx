import { useTheme } from "next-themes";
import { useTranslations } from "use-intl";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { useIsClient } from "@/hooks/use-is-client";
import { SettingsSection } from "./settings-section";

const THEMES = ["system", "light", "dark"] as const;

/** Interface language and color theme. */
export function SettingsAppearance() {
  const t = useTranslations("settings.appearance");

  return (
    <SettingsSection id="interface" title={t("heading")}>
      <Field>
        <FieldLabel>{t("language")}</FieldLabel>
        <div>
          <LanguageSwitcher />
        </div>
        <FieldDescription>{t("languageHint")}</FieldDescription>
      </Field>
      <SettingsTheme />
    </SettingsSection>
  );
}

function SettingsTheme() {
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();
  const t = useTranslations("settings.appearance");
  const tTheme = useTranslations("platform.theme");
  const items = THEMES.map((value) => ({ value, label: tTheme(value) }));

  return (
    <Field>
      <FieldLabel>{t("theme")}</FieldLabel>
      <div>
        <SegmentedControl
          aria-label={t("theme")}
          value={isClient ? (theme ?? "system") : "system"}
          onValueChange={setTheme}
          items={items}
        />
      </div>
    </Field>
  );
}
