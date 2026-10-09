import { A, D, R } from "@mobily/ts-belt";
import { nanoid } from "nanoid";
import { resumeToPreview } from "@/components/editor/resume-to-preview";
import { resumeToText } from "@/components/editor/resume-to-text";
import { runAtsCheck } from "@/lib/ats/check";
import type { Resume, ResumeLanguage } from "@/lib/resume/types";
import type { PendingAiResult } from "@/lib/store/ai-store";
import type { MaskOptions } from "./masking";
import type { AiMode } from "./prompts";
import { runAi } from "./run";
import type { AiError, AiProviderId } from "./types";

/** Everything one AI run needs besides the résumé. */
export interface AiRunSettings {
  mode: AiMode;
  provider: AiProviderId;
  model: string;
  apiKey: string;
  baseUrl: string;
  masking: MaskOptions;
  targetLanguage: ResumeLanguage;
  uiLanguage: string;
  /** The vacancy text; when empty, the résumé's own vacancy note is used. */
  vacancy?: string;
}

/**
 * Runs one AI task on one résumé and shapes the answer as a pending result
 * for review. The local ATS findings go along so the model can explain them
 * rather than rediscover them. Nothing is applied to the document here.
 */
export async function runAiOnResume(
  resume: Resume,
  settings: AiRunSettings,
  options: { pageCount: number; signal: AbortSignal },
): Promise<R.Result<PendingAiResult, AiError>> {
  const vacancy = settings.vacancy || resume.target?.description || "";
  const local = runAtsCheck({
    resume,
    text: resumeToText(resumeToPreview(resume)),
    pageCount: options.pageCount,
    jobDescription: vacancy,
  });
  const result = await runAi(
    {
      mode: settings.mode,
      resume,
      vacancy,
      targetLanguage: settings.targetLanguage,
      uiLanguage: settings.uiLanguage,
      masking: settings.masking,
      localFindings: A.map(local.issues, (issue) => issue.ruleId),
    },
    {
      provider: settings.provider,
      model: settings.model,
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl,
      signal: options.signal,
    },
  );
  return R.map(result, (value) => ({
    id: nanoid(),
    resumeId: resume.id,
    mode: settings.mode,
    provider: settings.provider,
    model: settings.model,
    createdAt: new Date().toISOString(),
    output: value.output,
    usage: value.usage,
    before: D.fromPairs(
      A.map(value.fields, (field) => [field.path, field.text] as const),
    ),
    ...(settings.mode === "translate" && {
      targetLanguage: settings.targetLanguage,
    }),
  }));
}
