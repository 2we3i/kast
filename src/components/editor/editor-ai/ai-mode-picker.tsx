import {
  ArticleIcon,
  CheckSquareOffsetIcon,
  CrosshairIcon,
  EnvelopeSimpleIcon,
  type Icon,
  MagnifyingGlassIcon,
  TranslateIcon,
} from "@phosphor-icons/react";
import { useTranslations } from "use-intl";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AI_MODES, type AiMode } from "@/lib/ai/prompts";
import { useAiStore } from "@/lib/store/ai-store";

const MODE_ICONS: Record<AiMode, Icon> = {
  rewrite: ArticleIcon,
  tailor: CrosshairIcon,
  ats: MagnifyingGlassIcon,
  consistency: CheckSquareOffsetIcon,
  translate: TranslateIcon,
  "cover-letter": EnvelopeSimpleIcon,
};

/** The seven-in-one task switch: what the AI should do with the résumé. */
export function AiModePicker() {
  const mode = useAiStore((state) => state.mode);
  const setMode = useAiStore((state) => state.setMode);
  const t = useTranslations("ai.modes");

  return (
    <RadioGroup
      value={mode}
      onValueChange={(value) => setMode(value as AiMode)}
      aria-label={t("label")}
      className="grid gap-2"
    >
      {AI_MODES.map((item) => {
        const ModeIcon = MODE_ICONS[item];
        return (
          <label
            key={item}
            htmlFor={`ai-mode-${item}`}
            className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-data-checked:border-primary has-data-checked:bg-primary/5"
          >
            <RadioGroupItem
              id={`ai-mode-${item}`}
              value={item}
              className="mt-0.5"
            />
            <ModeIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
              <span className="block text-sm font-medium">
                {t(`${item}.title`)}
              </span>
              <span className="block text-xs text-muted-foreground text-pretty">
                {t(`${item}.description`)}
              </span>
            </span>
          </label>
        );
      })}
    </RadioGroup>
  );
}
