import { A, S } from "@mobily/ts-belt";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useLocale, useTranslations } from "use-intl";
import { AiConsentDialog } from "@/components/editor/editor-ai/ai-consent-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { AI_PROVIDER_INFO } from "@/lib/ai/catalog";
import { formatUsd } from "@/lib/ai/estimate";
import { AI_MODES, type AiMode, VACANCY_MODES } from "@/lib/ai/prompts";
import type { AiRunSettings } from "@/lib/ai/run-resume";
import { RESUME_LANGUAGES } from "@/lib/resume/labels";
import type { ResumeIndexEntry, ResumeLanguage } from "@/lib/resume/types";
import { useAiStore } from "@/lib/store/ai-store";
import { useBatchEstimate } from "./use-batch-estimate";

export const BATCH_MIN = 1;

interface PlatformAiBatchFormProps {
  resumes: ReadonlyArray<ResumeIndexEntry>;
  onRun: (
    queue: ReadonlyArray<{ id: string; title: string }>,
    settings: AiRunSettings,
  ) => void;
}

/** Choose the résumés and the task, see the estimate, and start the batch. */
export function PlatformAiBatchForm(props: PlatformAiBatchFormProps) {
  const t = useTranslations("ai.batch");
  const tModes = useTranslations("ai.modes");
  const tPanel = useTranslations("ai.panel");
  const tLanguage = useTranslations("language");
  const uiLanguage = useLocale();
  const ai = useAiStore();
  const max = Math.min(5, ai.batchLimit);
  const [selected, setSelected] = useState<ReadonlyArray<string>>(() =>
    A.map(A.take(props.resumes, max), (resume) => resume.id),
  );
  const [mode, setMode] = useState<AiMode>("rewrite");
  const [vacancy, setVacancy] = useState("");
  const [language, setLanguage] = useState<ResumeLanguage>("en");
  const [consentOpen, setConsentOpen] = useState(false);
  const apiKey = ai.keys[ai.provider] ?? "";

  const settings: AiRunSettings = {
    mode,
    provider: ai.provider,
    model: ai.models[ai.provider],
    apiKey,
    baseUrl: ai.baseUrls[ai.provider],
    masking: ai.masking,
    targetLanguage: language,
    uiLanguage,
    vacancy: S.trim(vacancy),
  };
  const estimate = useBatchEstimate(selected, {
    mode,
    provider: ai.provider,
    model: ai.models[ai.provider],
    masking: ai.masking,
    targetLanguage: language,
    uiLanguage,
    vacancy: S.trim(vacancy),
  });
  const count = A.length(selected);
  const valid = count >= BATCH_MIN && count <= max;

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? A.append(current, id)
        : A.reject(current, (item) => item === id),
    );
  }

  function start() {
    const queue = A.filterMap(props.resumes, (resume) =>
      A.includes(selected, resume.id)
        ? { id: resume.id, title: resume.title }
        : undefined,
    );
    props.onRun(queue, settings);
  }

  function send() {
    if (!ai.consent[ai.provider]) {
      setConsentOpen(true);
      return;
    }
    start();
  }

  function estimateText(): string {
    if (!estimate) return "";
    const input = estimate.inputTokens;
    if (estimate.usd === null) return t("estimateNoPrice", { input });
    return t("estimate", { input, cost: formatUsd(estimate.usd, uiLanguage) });
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t("resumes")}</legend>
        <ScrollArea className="h-44 rounded-lg border">
          <ul className="flex flex-col p-1">
            {props.resumes.map((resume) => {
              const checked = A.includes(selected, resume.id);
              return (
                <li key={resume.id}>
                  <label
                    htmlFor={`batch-${resume.id}`}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <Checkbox
                      id={`batch-${resume.id}`}
                      checked={checked}
                      disabled={!checked && count >= max}
                      onCheckedChange={(value) =>
                        toggle(resume.id, value === true)
                      }
                    />
                    <span className="truncate">{resume.title}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
        <FieldDescription>
          {t("limit", { min: BATCH_MIN, max })}
        </FieldDescription>
      </fieldset>

      <Field>
        <FieldLabel htmlFor="batch-mode">{t("task")}</FieldLabel>
        <NativeSelect
          id="batch-mode"
          value={mode}
          onChange={(event) => setMode(event.target.value as AiMode)}
        >
          {AI_MODES.map((item) => (
            <NativeSelectOption key={item} value={item}>
              {tModes(`${item}.title`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldDescription>{tModes(`${mode}.description`)}</FieldDescription>
      </Field>

      {A.includes(VACANCY_MODES, mode) && (
        <Field>
          <FieldLabel htmlFor="batch-vacancy">{tPanel("vacancy")}</FieldLabel>
          <Textarea
            id="batch-vacancy"
            rows={4}
            value={vacancy}
            placeholder={tPanel("vacancyPlaceholder")}
            onChange={(event) => setVacancy(event.target.value)}
          />
        </Field>
      )}

      {mode === "translate" && (
        <Field>
          <FieldLabel htmlFor="batch-language">
            {tPanel("targetLanguage")}
          </FieldLabel>
          <NativeSelect
            id="batch-language"
            value={language}
            onChange={(event) =>
              setLanguage(event.target.value as ResumeLanguage)
            }
          >
            {RESUME_LANGUAGES.map((code) => (
              <NativeSelectOption key={code} value={code}>
                {tLanguage(code)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      )}

      <p className="text-xs text-muted-foreground">{estimateText()}</p>

      <Button disabled={!valid || !apiKey} onClick={send}>
        <PaperPlaneTiltIcon />
        {t("run", { count })}
      </Button>
      <p className="text-xs text-muted-foreground">
        {AI_PROVIDER_INFO[ai.provider].label} · {ai.models[ai.provider]}
      </p>
      <AiConsentDialog
        open={consentOpen}
        provider={ai.provider}
        onOpenChange={setConsentOpen}
        onConsent={start}
      />
    </div>
  );
}
