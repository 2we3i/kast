import { A } from "@mobily/ts-belt";
import { GearSixIcon, SparkleIcon, StopIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslations } from "use-intl";
import { AiKeyForm } from "@/components/shared/ai-key-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "@/i18n/navigation";
import { useResumeStore } from "@/lib/store";
import { useAiStore } from "@/lib/store/ai-store";
import { BATCH_MIN, PlatformAiBatchForm } from "./platform-ai-batch-form";
import { PlatformAiBatchProgress } from "./platform-ai-batch-progress";
import { useAiBatch } from "./use-ai-batch";

/**
 * "AI for several": one task over a handful of résumés from the Library.
 * Shown once there is more than one résumé to choose from.
 */
export function PlatformAiBatchDialog() {
  const t = useTranslations("ai.batch");
  const tPanel = useTranslations("ai.panel");
  const index = useResumeStore((state) => state.index);
  const provider = useAiStore((state) => state.provider);
  const hasKey = useAiStore((state) => Boolean(state.keys[state.provider]));
  const batchLimit = useAiStore((state) => state.batchLimit);
  const [open, setOpen] = useState(false);
  const batch = useAiBatch();

  if (A.length(index) < 2) return null;
  const started = A.isNotEmpty(batch.items);

  function onOpenChange(next: boolean) {
    if (!next && batch.running) return;
    if (!next) batch.reset();
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="outline" />}>
        <SparkleIcon /> {t("open")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", {
              min: BATCH_MIN,
              max: Math.min(5, batchLimit),
            })}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh]">
          <div className="pr-3">
            {!hasKey && !started && (
              <div className="flex flex-col gap-3">
                <Alert>
                  <AlertDescription>{t("needsKey")}</AlertDescription>
                </Alert>
                <AiKeyForm provider={provider} />
                <Link
                  href="/platform/settings"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  <GearSixIcon /> {tPanel("settingsLink")}
                </Link>
              </div>
            )}
            {hasKey && !started && (
              <PlatformAiBatchForm
                resumes={index}
                onRun={(queue, settings) => void batch.run(queue, settings)}
              />
            )}
            {started && (
              <PlatformAiBatchProgress
                items={batch.items}
                running={batch.running}
              />
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          {batch.running && (
            <Button variant="outline" onClick={batch.cancel}>
              <StopIcon /> {t("cancel")}
            </Button>
          )}
          {!batch.running && (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("close")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
