import { A, R } from "@mobily/ts-belt";
import {
  CheckCircleIcon,
  FilePdfIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslations } from "use-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  checkPdfText,
  expectedValues,
  type PdfTextReport,
} from "@/lib/ats/pdf-text-check";
import type { Resume } from "@/lib/resume/types";
import { resolveTemplateId } from "@/lib/templates";
import { buildResumeBlocks } from "../resume-blocks";
import { resumeToPreview } from "../resume-to-preview";

type CheckState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; report: PdfTextReport }
  | { status: "error" };

/**
 * Builds the real PDF, reads its text back with pdf.js the way an applicant
 * tracking system would, and confirms every key value is there, in reading
 * order. Both libraries load only when the check runs.
 */
async function runPdfCheck(resume: Resume): Promise<PdfTextReport | null> {
  const preview = resumeToPreview(resume);
  const [{ renderResumePdf }, { pdfToText }] = await Promise.all([
    import("../takumi/render-resume-pdf"),
    import("@/lib/import/pdf-import"),
  ]);
  const bytes = await renderResumePdf({
    preview,
    template: resolveTemplateId(resume.templateId),
  });
  const text = await pdfToText(bytes);
  if (R.isError(text)) return null;
  return checkPdfText(
    R.getExn(text),
    expectedValues(buildResumeBlocks(preview)),
  );
}

export function AtsPdfCheck(props: { resume: Resume }) {
  const t = useTranslations("editor.document");
  const [state, setState] = useState<CheckState>({ status: "idle" });

  async function run() {
    setState({ status: "running" });
    try {
      const report = await runPdfCheck(props.resume);
      setState(report ? { status: "done", report } : { status: "error" });
    } catch {
      setState({ status: "error" });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground text-pretty">
        {t("verifyHint")}
      </p>
      <Button
        variant="outline"
        className="w-fit"
        disabled={state.status === "running"}
        onClick={() => void run()}
      >
        {state.status === "running" ? <Spinner /> : <FilePdfIcon />}
        {state.status === "running" ? t("verifyRunning") : t("verifyRun")}
      </Button>
      <output aria-live="polite">
        {state.status === "done" && <AtsPdfResult report={state.report} />}
        {state.status === "error" && (
          <Alert variant="destructive">
            <WarningCircleIcon className="size-4" />
            <AlertTitle>{t("verifyError")}</AlertTitle>
          </Alert>
        )}
      </output>
    </div>
  );
}

function AtsPdfResult(props: { report: PdfTextReport }) {
  const t = useTranslations("editor.document");
  const { report } = props;
  const passed = A.isEmpty(report.missing) && report.inOrder;

  if (passed) {
    return (
      <Alert>
        <CheckCircleIcon className="size-4 text-success" />
        <AlertTitle>{t("verifyPassed", { total: report.total })}</AlertTitle>
      </Alert>
    );
  }
  if (A.isEmpty(report.missing)) {
    return (
      <Alert variant="destructive">
        <WarningCircleIcon className="size-4" />
        <AlertTitle>{t("verifyOrder")}</AlertTitle>
      </Alert>
    );
  }
  return (
    <Alert variant="destructive">
      <WarningCircleIcon className="size-4" />
      <AlertTitle>
        {t("verifyFailed", { missing: A.length(report.missing) })}
      </AlertTitle>
      {A.isNotEmpty(report.missing) && (
        <AlertDescription className="text-xs break-words">
          {t("verifyMissing", { values: A.join(report.missing, ", ") })}
        </AlertDescription>
      )}
    </Alert>
  );
}
