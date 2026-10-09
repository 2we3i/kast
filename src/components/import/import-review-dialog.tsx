import { A, R } from "@mobily/ts-belt";
import {
  CheckCircleIcon,
  SparkleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useLocale, useTranslations } from "use-intl";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import type { ImportDraft, ParseResult } from "@/lib/import";
import { useAiStore } from "@/lib/store/ai-store";
import { resolveTemplateId } from "@/lib/templates";
import { ResumeThumbnail } from "../editor/resume-thumbnail";
import { resumeToPreview } from "../editor/resume-to-preview";
import { ImportReviewDetails } from "./import-review-details";
import {
  countUncertain,
  ImportReviewFields,
  setDraftField,
} from "./import-review-fields";

interface ImportReviewDialogProps {
  draft: ImportDraft;
  onConfirm: (result: ParseResult) => void;
  onCancel: () => void;
}

/**
 * The review step between parsing a PDF and saving a résumé: what was found,
 * which fields to check (marked, with the parser's confidence), what was
 * removed as page furniture or kept as metadata, and a preview. Nothing is
 * saved until the user confirms.
 */
export function ImportReviewDialog(props: ImportReviewDialogProps) {
  const t = useTranslations("import.review");
  const locale = useLocale();
  const [resume, setResume] = useState(props.draft.resume);
  const [onlyUncertain, setOnlyUncertain] = useState(
    countUncertain(props.draft) > 0,
  );
  const [aiState, setAiState] = useState<"idle" | "running" | "error">("idle");
  const [aiNotes, setAiNotes] = useState<ReadonlyArray<string>>([]);
  const hasKey = useAiStore((state) => Boolean(state.keys[state.provider]));
  const consented = useAiStore((state) =>
    Boolean(state.consent[state.provider]),
  );
  const uncertain = countUncertain(props.draft);
  const sections = A.filter(resume.sections, (section) =>
    A.isNotEmpty(section.entries),
  );

  async function improveWithAi() {
    const ai = useAiStore.getState();
    const apiKey = ai.keys[ai.provider];
    if (!apiKey) return;
    setAiState("running");
    const { improveImport } = await import("@/lib/ai/import-assist");
    const result = await improveImport({
      draft: resume,
      pdfText: props.draft.text,
      uiLanguage: locale,
      masking: ai.masking,
      connection: {
        provider: ai.provider,
        model: ai.models[ai.provider],
        apiKey,
        baseUrl: ai.baseUrls[ai.provider],
        signal: AbortSignal.timeout(180_000),
      },
    });
    if (R.isError(result)) {
      setAiState("error");
      return;
    }
    const value = R.getExn(result);
    setResume(value.resume);
    setAiNotes(value.notes);
    setOnlyUncertain(false);
    setAiState("idle");
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) props.onCancel();
      }}
    >
      <ResponsiveDialogContent className="sm:max-w-5xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("title")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t("description")}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="flex flex-wrap gap-2 py-2">
          <Badge variant="secondary">{t(`layout.${props.draft.layout}`)}</Badge>
          <Badge variant="secondary">
            {t("sections", { count: A.length(sections) })}
          </Badge>
          <Badge variant={uncertain > 0 ? "outline" : "secondary"}>
            {uncertain > 0 && <WarningCircleIcon className="text-warning" />}
            {t("uncertain", { count: uncertain })}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_16rem]">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="review-only-uncertain"
                className="text-sm text-muted-foreground"
              >
                {t("onlyUncertain")}
              </label>
              <Switch
                id="review-only-uncertain"
                checked={onlyUncertain}
                onCheckedChange={setOnlyUncertain}
              />
            </div>
            <ScrollArea className="h-[50svh] rounded-lg border p-3">
              <ImportReviewFields
                draft={props.draft}
                resume={resume}
                onlyUncertain={onlyUncertain}
                onChange={(key, value) =>
                  setResume((current) => setDraftField(current, key, value))
                }
              />
            </ScrollArea>
            {A.isNotEmpty(aiNotes) && (
              <Alert>
                <SparkleIcon className="size-4" />
                <AlertDescription className="text-xs">
                  <ul className="list-disc pl-4">
                    {aiNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <ImportReviewDetails draft={props.draft} />
          </div>

          <div className="hidden flex-col gap-2 md:flex">
            <p className="text-xs font-medium text-muted-foreground">
              {t("preview")}
            </p>
            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <ResumeThumbnail
                resume={resumeToPreview(resume)}
                template={resolveTemplateId(resume.templateId)}
              />
            </div>
          </div>
        </div>

        {aiState === "error" && (
          <p className="text-sm text-destructive">{t("aiFailed")}</p>
        )}

        <ResponsiveDialogFooter className="gap-2">
          <Button variant="outline" onClick={props.onCancel}>
            {t("cancel")}
          </Button>
          {hasKey && consented && (
            <Button
              variant="outline"
              disabled={aiState === "running"}
              onClick={() => void improveWithAi()}
            >
              {aiState === "running" ? <Spinner /> : <SparkleIcon />}
              {t("improveWithAi")}
            </Button>
          )}
          <Button
            onClick={() =>
              props.onConfirm({ resume, leftovers: props.draft.leftovers })
            }
          >
            <CheckCircleIcon /> {t("confirm")}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
