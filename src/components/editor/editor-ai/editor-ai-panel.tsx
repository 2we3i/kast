import { A, S } from "@mobily/ts-belt";
import {
  GearSixIcon,
  PaperPlaneTiltIcon,
  SparkleIcon,
  StopIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useTranslations } from "use-intl";
import { AiKeyForm } from "@/components/shared/ai-key-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { AI_PROVIDER_IDS, AI_PROVIDER_INFO } from "@/lib/ai/catalog";
import { VACANCY_MODES } from "@/lib/ai/prompts";
import type { AiProviderId } from "@/lib/ai/types";
import { RESUME_LANGUAGES } from "@/lib/resume/labels";
import type { ResumeLanguage } from "@/lib/resume/types";
import { useResumeStore } from "@/lib/store";
import { useAiStore } from "@/lib/store/ai-store";
import { EMPTY_TARGET } from "../editor-toolbar/editor-target-dialog";
import { AiConsentDialog } from "./ai-consent-dialog";
import { AiModePicker } from "./ai-mode-picker";
import { AiRequestPreview } from "./ai-request-preview";
import { AiResultCard } from "./ai-result-card";
import { useAiRun } from "./use-ai-run";

/**
 * The optional AI assistant. Everything here runs with the user's own key,
 * straight from the browser to the provider they chose, after a one-time
 * consent; every suggestion waits for review. Without a key the rest of Kast
 * is unaffected.
 */
export function EditorAiPanel() {
  const open = useResumeStore((state) => state.open);
  const provider = useAiStore((state) => state.provider);
  const hasKey = useAiStore((state) => Boolean(state.keys[state.provider]));
  const results = useAiStore((state) => state.results);
  const t = useTranslations("ai");

  if (!open) return null;
  const pending = A.filter(results, (result) => result.resumeId === open.id);

  return (
    <div className="flex flex-col gap-5 p-4">
      <Alert>
        <SparkleIcon className="size-4" />
        <AlertTitle>{t("panel.title")}</AlertTitle>
        <AlertDescription className="text-xs text-pretty">
          {t("panel.intro")}
        </AlertDescription>
      </Alert>

      <AiProviderPicker />

      {!hasKey && (
        <section className="flex flex-col gap-3 rounded-lg border p-3">
          <AiKeyForm provider={provider} />
          <Link
            href="/platform/settings"
            className="flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            <GearSixIcon /> {t("panel.settingsLink")}
          </Link>
        </section>
      )}

      {A.isNotEmpty(pending) && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">{t("panel.pending")}</h3>
          {pending.map((result) => (
            <AiResultCard key={result.id} result={result} />
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">{t("panel.task")}</h3>
        <AiModePicker />
        <AiModeOptions />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">{t("panel.sent")}</h3>
        <AiRequestPreview resume={open} />
      </section>

      <AiSendBar disabled={!hasKey} />
    </div>
  );
}

function AiProviderPicker() {
  const provider = useAiStore((state) => state.provider);
  const model = useAiStore((state) => state.models[state.provider]);
  const setProvider = useAiStore((state) => state.setProvider);
  const setModel = useAiStore((state) => state.setModel);
  const t = useTranslations("ai.panel");
  const info = AI_PROVIDER_INFO[provider];
  const known = A.some(info.models, (item) => item.id === model);

  return (
    <div className="grid grid-cols-2 gap-2">
      <Field>
        <FieldLabel htmlFor="ai-provider">{t("provider")}</FieldLabel>
        <Select
          value={provider}
          onValueChange={(value) => setProvider(value as AiProviderId)}
        >
          <SelectTrigger id="ai-provider" className="w-full">
            <SelectValue>
              {(value: AiProviderId) => AI_PROVIDER_INFO[value].label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {AI_PROVIDER_IDS.map((id) => (
                <SelectItem key={id} value={id}>
                  {AI_PROVIDER_INFO[id].label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="ai-model">{t("model")}</FieldLabel>
        <Select
          value={known ? model : "custom"}
          onValueChange={(value) => {
            if (value && value !== "custom") setModel(provider, value);
          }}
        >
          <SelectTrigger id="ai-model" className="w-full">
            <SelectValue>
              {(value: string) =>
                value === "custom"
                  ? model
                  : (A.find(info.models, (item) => item.id === value)?.label ??
                    value)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {info.models.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
              {!known && <SelectItem value="custom">{model}</SelectItem>}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

function AiModeOptions() {
  const mode = useAiStore((state) => state.mode);
  const targetLanguage = useAiStore((state) => state.targetLanguage);
  const setTargetLanguage = useAiStore((state) => state.setTargetLanguage);
  const documentLanguage = useResumeStore((state) => state.open?.language);
  const vacancy = useResumeStore(
    (state) => state.open?.target?.description ?? "",
  );
  const updateOpen = useResumeStore((state) => state.updateOpen);
  const t = useTranslations("ai.panel");
  const tl = useTranslations("language");

  if (A.includes(VACANCY_MODES, mode)) {
    return (
      <Field>
        <FieldLabel htmlFor="ai-vacancy">{t("vacancy")}</FieldLabel>
        <Textarea
          id="ai-vacancy"
          rows={5}
          value={vacancy}
          placeholder={t("vacancyPlaceholder")}
          onChange={(event) =>
            updateOpen((resume) => ({
              ...resume,
              target: {
                ...EMPTY_TARGET,
                ...resume.target,
                description: event.target.value,
              },
            }))
          }
        />
      </Field>
    );
  }
  if (mode === "translate") {
    const targets = A.reject(
      RESUME_LANGUAGES,
      (code) => code === documentLanguage,
    );
    return (
      <Field>
        <FieldLabel htmlFor="ai-target-language">
          {t("targetLanguage")}
        </FieldLabel>
        <Select
          value={A.includes(targets, targetLanguage) ? targetLanguage : null}
          onValueChange={(value) => {
            if (value) setTargetLanguage(value as ResumeLanguage);
          }}
        >
          <SelectTrigger id="ai-target-language" className="w-full">
            <SelectValue placeholder={t("targetLanguagePlaceholder")}>
              {(value: ResumeLanguage) => tl(value)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {targets.map((code) => (
                <SelectItem key={code} value={code}>
                  {tl(code)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    );
  }
  return null;
}

function AiSendBar(props: { disabled: boolean }) {
  const provider = useAiStore((state) => state.provider);
  const consented = useAiStore((state) =>
    Boolean(state.consent[state.provider]),
  );
  const mode = useAiStore((state) => state.mode);
  const targetLanguage = useAiStore((state) => state.targetLanguage);
  const documentLanguage = useResumeStore((state) => state.open?.language);
  const vacancy = useResumeStore(
    (state) => state.open?.target?.description ?? "",
  );
  const { state, run, cancel } = useAiRun();
  const [consentOpen, setConsentOpen] = useState(false);
  const t = useTranslations("ai");
  const elapsed = useElapsed(
    state.status === "running" ? state.startedAt : null,
  );

  const missingVacancy =
    A.includes(VACANCY_MODES, mode) && S.isEmpty(S.trim(vacancy));
  const sameLanguage =
    mode === "translate" && targetLanguage === documentLanguage;
  const blocked = props.disabled || missingVacancy || sameLanguage;

  function send() {
    if (!consented) {
      setConsentOpen(true);
      return;
    }
    void run();
  }

  return (
    <section className="sticky bottom-0 flex flex-col gap-2 border-t bg-background/95 py-3 backdrop-blur">
      {state.status === "error" && (
        <Alert variant="destructive">
          <WarningCircleIcon className="size-4" />
          <AlertTitle>{t(`errors.${state.error.kind}`)}</AlertTitle>
          <AlertDescription className="text-xs break-words">
            {state.error.detail}
          </AlertDescription>
        </Alert>
      )}
      {missingVacancy && (
        <p className="text-xs text-muted-foreground">
          {t("panel.needsVacancy")}
        </p>
      )}
      {state.status === "running" ? (
        <div className="flex items-center gap-2">
          <output
            className="flex flex-1 items-center gap-2 text-sm"
            aria-live="polite"
          >
            <Spinner /> {t("panel.running", { seconds: elapsed })}
          </output>
          <Button variant="outline" onClick={cancel}>
            <StopIcon /> {t("panel.cancel")}
          </Button>
        </div>
      ) : (
        <Button disabled={blocked} onClick={send} id="tour-ai-send">
          <PaperPlaneTiltIcon />
          {t("panel.send", { provider: AI_PROVIDER_INFO[provider].label })}
        </Button>
      )}
      <AiConsentDialog
        open={consentOpen}
        provider={provider}
        onOpenChange={setConsentOpen}
        onConsent={() => void run()}
      />
    </section>
  );
}

/** Whole seconds since `start`, ticking once a second while set. */
function useElapsed(start: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (start === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [start]);
  return start === null ? 0 : Math.max(0, Math.round((now - start) / 1000));
}
