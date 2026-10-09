import { A } from "@mobily/ts-belt";
import { QuestionIcon, XIcon } from "@phosphor-icons/react";
import { useFormatter, useLocale, useTranslations } from "use-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AI_PROVIDER_INFO } from "@/lib/ai/catalog";
import { estimateCost, formatUsd } from "@/lib/ai/estimate";
import { languageName } from "@/lib/ai/prompts";
import { type PendingAiResult, useAiStore } from "@/lib/store/ai-store";
import { AiChangesReview } from "./ai-changes-review";
import { AiFindingsList } from "./ai-findings-list";
import { AiLetterResult } from "./ai-letter-result";

interface AiResultCardProps {
  result: PendingAiResult;
}

/** One finished run: what it found or proposes, for review. */
export function AiResultCard(props: AiResultCardProps) {
  const { result } = props;
  const dismiss = useAiStore((state) => state.dismissResult);
  const t = useTranslations("ai");
  const format = useFormatter();
  const locale = useLocale();
  const cost = estimateCost({
    provider: result.provider,
    model: result.model,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
  });
  const done = () => dismiss(result.id);
  const snapshotLabel = t("snapshotLabel", {
    mode: t(`modes.${result.mode}.title`),
  });
  const output = result.output;
  const questions: ReadonlyArray<string> =
    "questions" in output.value ? output.value.questions : [];

  return (
    <article className="flex flex-col gap-3 rounded-xl border bg-card p-3">
      <header className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {t(`modes.${result.mode}.title`)}
          </p>
          <p className="text-xs text-muted-foreground">
            {AI_PROVIDER_INFO[result.provider].label} · {result.model} ·{" "}
            {format.dateTime(new Date(result.createdAt), {
              timeStyle: "short",
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("usage", {
              input: result.usage.inputTokens,
              output: result.usage.outputTokens,
              cost: cost.usd === null ? "none" : formatUsd(cost.usd, locale),
            })}
          </p>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={t("review.dismiss")}
          onClick={done}
        >
          <XIcon />
        </Button>
      </header>

      {(output.mode === "ats" || output.mode === "consistency") && (
        <AiFindingsList
          summary={output.value.summary}
          findings={output.value.findings}
        />
      )}

      {output.mode === "tailor" &&
        A.isNotEmpty(output.value.missingKeywords) && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              {t("review.missingKeywords")}
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {output.value.missingKeywords.map((item) => (
                <li key={item.keyword}>
                  <Badge variant="outline">{item.keyword}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

      {output.mode === "cover-letter" && (
        <AiLetterResult
          letter={output.value}
          snapshotLabel={snapshotLabel}
          onApplied={done}
        />
      )}

      {output.mode !== "cover-letter" && (
        <AiChangesReview
          changes={output.value.changes}
          before={result.before}
          snapshotLabel={snapshotLabel}
          switchLanguageTo={result.targetLanguage}
          onApplied={done}
        />
      )}

      {result.targetLanguage && (
        <p className="text-xs text-muted-foreground">
          {t("review.translateNote", {
            language: languageName(result.targetLanguage),
          })}
        </p>
      )}

      {A.isNotEmpty(questions) && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium">
            <QuestionIcon /> {t("review.questions")}
          </p>
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
