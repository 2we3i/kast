import { D } from "@mobily/ts-belt";
import { EyeIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { useLocale, useTranslations } from "use-intl";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { estimateCost, formatUsd } from "@/lib/ai/estimate";
import type { MaskOptions } from "@/lib/ai/masking";
import { prepareRequest } from "@/lib/ai/run";
import type { Resume } from "@/lib/resume/types";
import { useAiStore } from "@/lib/store/ai-store";

const MASK_KEYS: ReadonlyArray<keyof MaskOptions> = [
  "name",
  "email",
  "phone",
  "address",
  "links",
];

interface AiRequestPreviewProps {
  resume: Resume;
}

/**
 * Exactly what will leave the browser, with the masking switches beside it,
 * and the approximate size and cost of the request.
 */
export function AiRequestPreview(props: AiRequestPreviewProps) {
  const ai = useAiStore();
  const uiLanguage = useLocale();
  const t = useTranslations("ai.preview");
  const prepared = useMemo(
    () =>
      prepareRequest({
        mode: ai.mode,
        resume: props.resume,
        vacancy: props.resume.target?.description ?? "",
        targetLanguage: ai.targetLanguage,
        uiLanguage,
        masking: ai.masking,
        localFindings: [],
      }),
    [ai.mode, ai.targetLanguage, ai.masking, props.resume, uiLanguage],
  );
  const cost = estimateCost({
    provider: ai.provider,
    model: ai.models[ai.provider],
    inputTokens: prepared.inputTokens,
    outputTokens: prepared.outputTokens,
  });

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t("maskLegend")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {MASK_KEYS.map((key) => (
            <label
              key={key}
              htmlFor={`mask-${key}`}
              className="flex items-center gap-2 text-sm"
            >
              <Checkbox
                id={`mask-${key}`}
                checked={ai.masking[key]}
                onCheckedChange={(checked) =>
                  ai.setMasking(D.set(ai.masking, key, checked === true))
                }
              />
              {t(`mask.${key}`)}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("photoNever")}</p>
      </fieldset>

      <p className="text-xs text-muted-foreground">
        {cost.usd === null
          ? t("estimateNoPrice", {
              input: cost.inputTokens,
              output: cost.outputTokens,
            })
          : t("estimate", {
              input: cost.inputTokens,
              output: cost.outputTokens,
              cost: formatUsd(cost.usd, uiLanguage),
            })}
      </p>

      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline">
          <EyeIcon /> {t("show")}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ScrollArea className="mt-2 h-64 rounded-md border bg-muted/40">
            <pre className="whitespace-pre-wrap break-words p-3 font-mono text-[0.6875rem] leading-relaxed">
              {prepared.prompt}
            </pre>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
