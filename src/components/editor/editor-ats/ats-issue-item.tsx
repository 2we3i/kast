import { A, D } from "@mobily/ts-belt";
import {
  ArrowRightIcon,
  InfoIcon,
  WarningCircleIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button";
import type { AtsIssue } from "@/lib/ats/types";
import { useEditorChromeStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const SEVERITY_ICON = {
  error: WarningCircleIcon,
  warning: WarningIcon,
  info: InfoIcon,
} as const;

interface AtsIssueItemProps {
  issue: AtsIssue;
}

/** One finding: what is wrong, how to fix it, and a jump to the section. */
export function AtsIssueItem(props: AtsIssueItemProps) {
  const { issue } = props;
  const t = useTranslations("ats");
  const tSections = useTranslations("editor.generic.titles");
  const revealSection = useEditorChromeStore((state) => state.revealSection);
  const Icon = SEVERITY_ICON[issue.severity];
  const params = localizeParams(issue.params ?? {}, (type) =>
    tSections.has(type) ? tSections(type) : type,
  );
  const goTo = issue.target?.sectionId ?? issue.target?.sectionType;

  return (
    <li className="flex gap-3 py-3">
      <Icon
        weight="fill"
        className={cn("mt-0.5 size-4 shrink-0", {
          "text-destructive": issue.severity === "error",
          "text-warning": issue.severity === "warning",
          "text-muted-foreground": issue.severity === "info",
        })}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {t(`rules.${issue.ruleId}.title`, params)}
        </p>
        <p className="text-xs text-muted-foreground text-pretty">
          {t(`rules.${issue.ruleId}.fix`, params)}
        </p>
        {goTo && (
          <Button
            variant="link"
            size="sm"
            className="h-auto px-0 text-xs"
            onClick={() => revealSection(goTo)}
          >
            {t("goToSection")} <ArrowRightIcon />
          </Button>
        )}
      </div>
    </li>
  );
}

const SECTION_PARAMS = ["section", "before", "after"] as const;

/** Section types in params ("experience") read as their UI names. */
function localizeParams(
  params: Record<string, string | number>,
  sectionName: (type: string) => string,
): Record<string, string | number> {
  return A.reduce(SECTION_PARAMS, params, (result, key) => {
    const value = result[key];
    return typeof value === "string"
      ? D.set(result, key, sectionName(value))
      : result;
  });
}
