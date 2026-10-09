import { A } from "@mobily/ts-belt";
import {
  ClockCounterClockwiseIcon,
  FloppyDiskIcon,
} from "@phosphor-icons/react";
import { type FormEvent, useState } from "react";
import { useTranslations } from "use-intl";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useSnapshots } from "@/hooks/use-snapshots";
import { SNAPSHOT_LIMIT } from "@/lib/db";
import { useResumeStore } from "@/lib/store";
import { EditorVersionItem } from "./editor-version-item";

/** The version-history sheet: save a named version, browse, restore. */
export function EditorVersions() {
  const t = useTranslations("editor.versions");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="outline" size="sm" id="tour-versions" />}
      >
        <ClockCounterClockwiseIcon /> {t("open")}
      </SheetTrigger>
      <SheetContent side="right" className="gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>
            {t("description", { limit: SNAPSHOT_LIMIT })}
          </SheetDescription>
        </SheetHeader>
        <EditorVersionsSave />
        <EditorVersionsList onRestored={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

function EditorVersionsSave() {
  const takeSnapshot = useResumeStore((state) => state.takeSnapshot);
  const t = useTranslations("editor.versions");
  const [label, setLabel] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void takeSnapshot("manual", label.trim() || undefined);
    setLabel("");
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2 border-b px-4 pb-4">
      <Input
        aria-label={t("labelField")}
        placeholder={t("labelPlaceholder")}
        value={label}
        onChange={(event) => setLabel(event.target.value)}
      />
      <Button type="submit">
        <FloppyDiskIcon /> {t("save")}
      </Button>
    </form>
  );
}

function EditorVersionsList(props: { onRestored: () => void }) {
  const snapshots = useSnapshots();
  const t = useTranslations("editor.versions");

  if (snapshots === null) {
    return (
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
    );
  }
  if (A.isEmpty(snapshots)) {
    return (
      <div className="p-4">
        <EmptyState
          icon={ClockCounterClockwiseIcon}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      </div>
    );
  }
  return (
    <ScrollArea className="h-[calc(100svh-13rem)]">
      <ul className="flex flex-col divide-y">
        {snapshots.map((snapshot) => (
          <EditorVersionItem
            key={snapshot.id}
            snapshot={snapshot}
            onRestored={props.onRestored}
          />
        ))}
      </ul>
    </ScrollArea>
  );
}
