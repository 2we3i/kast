import { S } from "@mobily/ts-belt";
import { BriefcaseIcon } from "@phosphor-icons/react";
import { useTranslations } from "use-intl";
import { Badge } from "@/components/ui/badge";
import type { ResumeIndexEntry } from "@/lib/resume";
import { cn } from "@/lib/utils";

const STATUS_TONE = {
  draft: "bg-muted text-muted-foreground",
  applied: "bg-primary/10 text-primary",
  interview: "bg-brand-accent/25 text-foreground",
  offer: "bg-success/15 text-success",
  rejected: "bg-destructive/10 text-destructive",
} as const;

/** The vacancy a résumé is tailored to: position, company, and status. */
export function PlatformResumeGridItemTarget(props: {
  target: NonNullable<ResumeIndexEntry["target"]>;
}) {
  const t = useTranslations("platform.grid");
  const tStatus = useTranslations("editor.target.statuses");
  const { target } = props;
  const position = S.trim(target.position);
  const company = S.trim(target.company);

  function label(): string {
    if (position && company) return t("targetAt", { position, company });
    return position || company;
  }

  return (
    <div className="flex min-w-0 items-center gap-2 text-xs">
      {(position || company) && (
        <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
          <BriefcaseIcon className="size-3.5 shrink-0" />
          <span className="truncate">{label()}</span>
        </span>
      )}
      <Badge className={cn("shrink-0 border-0", STATUS_TONE[target.status])}>
        {tStatus(target.status)}
      </Badge>
    </div>
  );
}
