import { A } from "@mobily/ts-belt";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useTranslations } from "use-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FindingsResult } from "@/lib/ai/schemas";
import { useEditorChromeStore } from "@/lib/store";

interface AiFindingsListProps {
  summary: string;
  findings: FindingsResult["findings"];
}

const SEVERITY_VARIANT = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
} as const;

/** The AI's analysis: a summary, then each finding with its fix. */
export function AiFindingsList(props: AiFindingsListProps) {
  const revealSection = useEditorChromeStore((state) => state.revealSection);
  const t = useTranslations("ai.review");

  return (
    <div className="flex flex-col gap-2">
      {props.summary && <p className="text-sm text-pretty">{props.summary}</p>}
      {A.isEmpty(props.findings) && (
        <p className="text-sm text-muted-foreground">{t("noFindings")}</p>
      )}
      <ul className="flex flex-col divide-y">
        {props.findings.map((finding) => {
          const sectionId = finding.path.split("/")[0];
          return (
            <li key={`${finding.title}-${finding.path}`} className="py-2">
              <div className="flex items-start gap-2">
                <Badge variant={SEVERITY_VARIANT[finding.severity]}>
                  {t(`severity.${finding.severity}`)}
                </Badge>
                <p className="text-sm font-medium">{finding.title}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground text-pretty">
                {finding.detail}
              </p>
              <p className="mt-1 text-xs text-pretty">
                <span className="font-medium">{t("fix")}</span> {finding.fix}
              </p>
              {sectionId && sectionId !== "header" && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto px-0 text-xs"
                  onClick={() => revealSection(sectionId)}
                >
                  {t("goTo")} <ArrowRightIcon />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
