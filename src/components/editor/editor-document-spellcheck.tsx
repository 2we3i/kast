import { useTranslations } from "use-intl";
import { Switch } from "@/components/ui/switch";
import { useIsClient } from "@/hooks/use-is-client";
import { usePreferencesStore } from "@/lib/store/preferences-store";

/** The browser's own spell check, in the résumé's language, on or off. */
export function EditorDocumentSpellcheck() {
  const spellcheck = usePreferencesStore((state) => state.spellcheck);
  const setSpellcheck = usePreferencesStore((state) => state.setSpellcheck);
  const isClient = useIsClient();
  const t = useTranslations("editor.document");

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <span
          id="document-spellcheck-label"
          className="text-sm text-muted-foreground"
        >
          {t("spellcheck")}
        </span>
        <Switch
          aria-labelledby="document-spellcheck-label"
          aria-describedby="document-spellcheck-hint"
          checked={isClient && spellcheck}
          onCheckedChange={setSpellcheck}
        />
      </div>
      <p
        id="document-spellcheck-hint"
        className="text-xs text-muted-foreground"
      >
        {t("spellcheckHint")}
      </p>
    </div>
  );
}
