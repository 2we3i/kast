import { A } from "@mobily/ts-belt";
import {
  CheckCircleIcon,
  CircleDashedIcon,
  MinusCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useTranslations } from "use-intl";
import { Spinner } from "@/components/ui/spinner";
import { Link } from "@/i18n/navigation";
import { editorTabHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { BatchItem } from "./use-ai-batch";

const STATUS_ICON = {
  queued: CircleDashedIcon,
  running: Spinner,
  done: CheckCircleIcon,
  failed: WarningCircleIcon,
  skipped: MinusCircleIcon,
} as const;

/** The batch's résumés with their status, and a link to review each result. */
export function PlatformAiBatchProgress(props: {
  items: ReadonlyArray<BatchItem>;
  running: boolean;
}) {
  const t = useTranslations("ai.batch");
  const total = A.length(props.items);
  const finished = A.length(
    A.filter(props.items, (item) => item.status !== "queued"),
  );
  const current = A.find(props.items, (item) => item.status === "running");

  function statusText(): string {
    if (!props.running) return t("done");
    if (!current) return "";
    return t("running", { title: current.title, done: finished, total });
  }

  return (
    <div className="flex flex-col gap-3">
      <output aria-live="polite" className="text-sm">
        {statusText()}
      </output>
      <ul className="flex flex-col divide-y rounded-lg border">
        {props.items.map((item) => (
          <PlatformAiBatchProgressItem key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

function PlatformAiBatchProgressItem(props: { item: BatchItem }) {
  const t = useTranslations("ai.batch");
  const tErrors = useTranslations("ai.errors");
  const tPanel = useTranslations("ai.panel");
  const { item } = props;
  const Icon = STATUS_ICON[item.status];

  function failure(): string {
    if (item.failure === "needs-vacancy") return tPanel("needsVacancy");
    if (item.failure === "missing" || !item.failure) return "";
    return tErrors(item.failure);
  }

  return (
    <li className="flex items-center gap-3 px-3 py-2 text-sm">
      <Icon
        className={cn(
          "size-4 shrink-0",
          item.status === "failed"
            ? "text-destructive"
            : "text-muted-foreground",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.title}</p>
        {item.status === "failed" && (
          <p className="text-xs text-destructive">
            {t("failed", { title: item.title, error: failure() })}
          </p>
        )}
      </div>
      {item.status === "done" && (
        <Link
          href={editorTabHref(item.id, "ai")}
          className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("review")}
        </Link>
      )}
    </li>
  );
}
