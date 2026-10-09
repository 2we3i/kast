import { R } from "@mobily/ts-belt";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "use-intl";
import type { AiError } from "@/lib/ai/types";
import { useEditorChromeStore, useResumeStore } from "@/lib/store";
import { useAiStore } from "@/lib/store/ai-store";

export type AiRunState =
  | { status: "idle" }
  | { status: "running"; startedAt: number }
  | { status: "error"; error: AiError };

/** Gives up on an answer after this long; the request is aborted. */
export const AI_TIMEOUT_MS = 180_000;

/**
 * Runs the selected AI task on the open résumé, with cancel and timeout.
 * The finished answer goes to the pending results for review; nothing is
 * applied to the document here.
 */
export function useAiRun() {
  const [state, setState] = useState<AiRunState>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);
  const uiLanguage = useLocale();

  // Abort an in-flight request when the panel goes away.
  useEffect(() => () => controller.current?.abort(), []);

  async function run() {
    const resume = useResumeStore.getState().open;
    const ai = useAiStore.getState();
    const apiKey = ai.keys[ai.provider];
    if (!resume || !apiKey) return;
    const abort = new AbortController();
    controller.current = abort;
    const timeout = window.setTimeout(
      () => abort.abort(new DOMException("timeout", "TimeoutError")),
      AI_TIMEOUT_MS,
    );
    setState({ status: "running", startedAt: Date.now() });
    const { runAiOnResume } = await import("@/lib/ai/run-resume");
    const result = await runAiOnResume(
      resume,
      {
        mode: ai.mode,
        provider: ai.provider,
        model: ai.models[ai.provider],
        apiKey,
        baseUrl: ai.baseUrls[ai.provider],
        masking: ai.masking,
        targetLanguage: ai.targetLanguage,
        uiLanguage,
      },
      {
        pageCount: useEditorChromeStore.getState().pageCount,
        signal: abort.signal,
      },
    );
    window.clearTimeout(timeout);
    controller.current = null;
    if (R.isError(result)) {
      const error = R.getExn(R.flip(result));
      setState(
        error.kind === "cancelled"
          ? { status: "idle" }
          : { status: "error", error },
      );
      return;
    }
    useAiStore.getState().addResult(R.getExn(result));
    setState({ status: "idle" });
  }

  function cancel() {
    controller.current?.abort();
  }

  return { state, run, cancel };
}
