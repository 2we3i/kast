import { A, R, S } from "@mobily/ts-belt";
import { useEffect, useRef, useState } from "react";
import { AI_TIMEOUT_MS } from "@/components/editor/editor-ai/use-ai-run";
import type { AiRunSettings } from "@/lib/ai/run-resume";
import type { AiErrorKind } from "@/lib/ai/types";
import { getResume } from "@/lib/db/resume";
import { useAiStore } from "@/lib/store/ai-store";

export type BatchStatus = "queued" | "running" | "done" | "failed" | "skipped";

export type BatchFailure = AiErrorKind | "needs-vacancy" | "missing";

export interface BatchItem {
  id: string;
  title: string;
  status: BatchStatus;
  failure?: BatchFailure;
}

function update(
  items: ReadonlyArray<BatchItem>,
  id: string,
  patch: Partial<BatchItem>,
): ReadonlyArray<BatchItem> {
  return A.map(items, (item) =>
    item.id === id ? { ...item, ...patch } : item,
  );
}

/**
 * Runs one AI task over several résumés, one request at a time so the
 * provider's rate limits and the user's bill stay predictable. Each answer
 * joins the pending results of its résumé, to be reviewed in that résumé's
 * AI tab; nothing is applied here. Cancel stops the current request and
 * skips the rest.
 */
export function useAiBatch() {
  const [items, setItems] = useState<ReadonlyArray<BatchItem>>([]);
  const [running, setRunning] = useState(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  async function runOne(
    item: BatchItem,
    settings: AiRunSettings,
    abort: AbortController,
  ): Promise<Partial<BatchItem>> {
    const resume = await getResume(item.id);
    if (!resume) return { status: "failed", failure: "missing" };
    const needsVacancy =
      settings.mode === "tailor" || settings.mode === "cover-letter";
    const vacancy = settings.vacancy || resume.target?.description || "";
    if (needsVacancy && S.isEmpty(S.trim(vacancy))) {
      return { status: "failed", failure: "needs-vacancy" };
    }
    const timeout = window.setTimeout(
      () => abort.abort(new DOMException("timeout", "TimeoutError")),
      AI_TIMEOUT_MS,
    );
    const { runAiOnResume } = await import("@/lib/ai/run-resume");
    const result = await runAiOnResume(resume, settings, {
      pageCount: 0,
      signal: abort.signal,
    });
    window.clearTimeout(timeout);
    if (R.isError(result)) {
      const error = R.getExn(R.flip(result));
      return { status: "failed", failure: error.kind };
    }
    useAiStore.getState().addResult(R.getExn(result));
    return { status: "done" };
  }

  async function run(
    queue: ReadonlyArray<{ id: string; title: string }>,
    settings: AiRunSettings,
  ) {
    const initial = A.map(queue, (entry) => ({
      ...entry,
      status: "queued" as const,
    }));
    setItems(initial);
    setRunning(true);
    const outer = new AbortController();
    controller.current = outer;
    for (const item of initial) {
      if (outer.signal.aborted) {
        setItems((current) => update(current, item.id, { status: "skipped" }));
        continue;
      }
      setItems((current) => update(current, item.id, { status: "running" }));
      // One controller per request: a timeout aborts only that request.
      const abort = new AbortController();
      const relay = () => abort.abort();
      outer.signal.addEventListener("abort", relay, { once: true });
      const patch = await runOne(item, settings, abort);
      outer.signal.removeEventListener("abort", relay);
      const cancelled = patch.failure === "cancelled" && outer.signal.aborted;
      setItems((current) =>
        update(current, item.id, cancelled ? { status: "skipped" } : patch),
      );
    }
    controller.current = null;
    setRunning(false);
  }

  function cancel() {
    controller.current?.abort();
  }

  function reset() {
    setItems([]);
  }

  return { items, running, run, cancel, reset };
}
