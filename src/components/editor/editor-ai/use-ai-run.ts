import { A, D, R } from "@mobily/ts-belt";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "use-intl";
import type { AiError } from "@/lib/ai/types";
import { runAtsCheck } from "@/lib/ats/check";
import { useEditorChromeStore, useResumeStore } from "@/lib/store";
import { useAiStore } from "@/lib/store/ai-store";
import { resumeToPreview } from "../resume-to-preview";
import { resumeToText } from "../resume-to-text";

export type AiRunState =
  | { status: "idle" }
  | { status: "running"; startedAt: number }
  | { status: "error"; error: AiError };

/** Gives up on an answer after this long; the request is aborted. */
const TIMEOUT_MS = 180_000;

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
      TIMEOUT_MS,
    );
    setState({ status: "running", startedAt: Date.now() });
    const { runAi } = await import("@/lib/ai/run");
    const local = runAtsCheck({
      resume,
      text: resumeToText(resumeToPreview(resume)),
      pageCount: useEditorChromeStore.getState().pageCount,
      jobDescription: resume.target?.description ?? "",
    });
    const result = await runAi(
      {
        mode: ai.mode,
        resume,
        vacancy: resume.target?.description ?? "",
        targetLanguage: ai.targetLanguage,
        uiLanguage,
        masking: ai.masking,
        localFindings: A.map(local.issues, (issue) => issue.ruleId),
      },
      {
        provider: ai.provider,
        model: ai.models[ai.provider],
        apiKey,
        baseUrl: ai.baseUrls[ai.provider],
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
    const value = R.getExn(result);
    useAiStore.getState().addResult({
      id: nanoid(),
      resumeId: resume.id,
      mode: ai.mode,
      provider: ai.provider,
      model: ai.models[ai.provider],
      createdAt: new Date().toISOString(),
      output: value.output,
      usage: value.usage,
      before: D.fromPairs(
        A.map(value.fields, (field) => [field.path, field.text] as const),
      ),
      ...(ai.mode === "translate" && { targetLanguage: ai.targetLanguage }),
    });
    setState({ status: "idle" });
  }

  function cancel() {
    controller.current?.abort();
  }

  return { state, run, cancel };
}
