import { A } from "@mobily/ts-belt";
import { CheckCircleIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { useDeferredValue, useMemo } from "react";
import { useTranslations } from "use-intl";
import { EmptyState } from "@/components/shared/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { runAtsCheck } from "@/lib/ats/check";
import { useEditorChromeStore, useResumeStore } from "@/lib/store";
import { resumeToPreview } from "../resume-to-preview";
import { resumeToText } from "../resume-to-text";
import { AtsCategories } from "./ats-categories";
import { AtsIssueItem } from "./ats-issue-item";
import { AtsKeywords } from "./ats-keywords";
import { AtsScore } from "./ats-score";

/**
 * The ATS check, run locally on every edit: score, categories, findings with
 * fixes, and the vacancy keyword match. Nothing leaves the browser.
 */
export function EditorAtsPanel() {
  const open = useDeferredValue(useResumeStore((state) => state.open));
  const pageCount = useEditorChromeStore((state) => state.pageCount);
  const t = useTranslations("ats");
  const report = useMemo(() => {
    if (!open) return null;
    return runAtsCheck({
      resume: open,
      text: resumeToText(resumeToPreview(open)),
      pageCount,
      jobDescription: open.target?.description ?? "",
    });
  }, [open, pageCount]);

  if (!report) return null;

  return (
    <div className="flex flex-col divide-y px-4">
      <section className="flex flex-col gap-4 py-4">
        <AtsScore score={report.score} />
        <Alert>
          <ShieldCheckIcon className="size-4" />
          <AlertDescription className="text-xs">{t("local")}</AlertDescription>
        </Alert>
        <AtsCategories categories={report.categories} />
      </section>

      <section className="py-4">
        <h3 className="mb-1 text-sm font-medium">
          {t("issuesHeading", { count: A.length(report.issues) })}
        </h3>
        {A.isEmpty(report.issues) && (
          <EmptyState
            icon={CheckCircleIcon}
            title={t("noIssuesTitle")}
            description={t("noIssuesDescription")}
          />
        )}
        <ul className="divide-y">
          {report.issues.map((issue, index) => (
            <AtsIssueItem
              key={`${issue.ruleId}-${issue.target?.entryId ?? index}`}
              issue={issue}
            />
          ))}
        </ul>
      </section>

      <section className="py-4">
        <h3 className="mb-3 text-sm font-medium">{t("keywordsHeading")}</h3>
        <AtsKeywords report={report.keywords} />
      </section>

      <section className="py-4">
        <h3 className="mb-2 text-sm font-medium">{t("exportHeading")}</h3>
        <p className="text-xs text-muted-foreground text-pretty">
          {t("exportNote")}
        </p>
      </section>
    </div>
  );
}
