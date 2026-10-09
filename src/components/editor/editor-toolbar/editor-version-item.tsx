import { ArrowCounterClockwiseIcon, TrashIcon } from "@phosphor-icons/react";
import { useFormatter, useTranslations } from "use-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ResumeSnapshot } from "@/lib/db";
import { useResumeStore } from "@/lib/store";

interface EditorVersionItemProps {
  snapshot: ResumeSnapshot;
  onRestored: () => void;
}

/** One history entry: when, why, an optional label, restore and delete. */
export function EditorVersionItem(props: EditorVersionItemProps) {
  const { snapshot } = props;
  const restoreSnapshot = useResumeStore((state) => state.restoreSnapshot);
  const removeSnapshot = useResumeStore((state) => state.removeSnapshot);
  const t = useTranslations("editor.versions");
  const format = useFormatter();

  async function onRestore() {
    await restoreSnapshot(snapshot.id);
    props.onRestored();
  }

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {snapshot.label ?? snapshot.doc.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {format.dateTime(new Date(snapshot.createdAt), {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        <Badge variant="outline" className="mt-1">
          {t(`reasons.${snapshot.reason}`)}
        </Badge>
      </div>
      <Button size="sm" variant="outline" onClick={() => void onRestore()}>
        <ArrowCounterClockwiseIcon /> {t("restore")}
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label={t("delete")}
        onClick={() => void removeSnapshot(snapshot.id)}
      >
        <TrashIcon className="text-destructive" />
      </Button>
    </li>
  );
}
