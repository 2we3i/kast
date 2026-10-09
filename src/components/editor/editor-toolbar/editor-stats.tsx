import { WarningIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { useTranslations } from "use-intl";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { countWords, RECOMMENDED_MAX_PAGES } from "@/lib/resume/stats";
import { useEditorChromeStore, useResumeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { resumeToPreview } from "../resume-to-preview";
import { resumeToText } from "../resume-to-text";

/** Word and page count of the open résumé, warning past two pages. */
export function EditorStats() {
  const open = useResumeStore((state) => state.open);
  const pages = useEditorChromeStore((state) => state.pageCount);
  const t = useTranslations("editor.stats");
  const words = useMemo(
    () => (open ? countWords(resumeToText(resumeToPreview(open))) : 0),
    [open],
  );
  if (!open) return null;
  const tooLong = pages > RECOMMENDED_MAX_PAGES;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            variant={tooLong ? "destructive" : "secondary"}
            className={cn("gap-1 tabular-nums", tooLong && "cursor-help")}
            aria-live="polite"
          />
        }
      >
        {tooLong && <WarningIcon className="size-3" />}
        {t("summary", { words, pages })}
      </TooltipTrigger>
      <TooltipContent>
        {tooLong ? t("tooLong", { max: RECOMMENDED_MAX_PAGES }) : t("hint")}
      </TooltipContent>
    </Tooltip>
  );
}
