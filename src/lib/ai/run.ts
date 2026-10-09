import { A, R, S } from "@mobily/ts-belt";
import type { Resume, ResumeLanguage } from "@/lib/resume/types";
import { type AiField, buildAiFields } from "./ai-view";
import { estimateOutputTokens, estimateTokens, maxTokensFor } from "./estimate";
import {
  buildMask,
  type MaskMap,
  type MaskOptions,
  maskText,
  unmaskDeep,
} from "./masking";
import { type AiMode, retryNote, systemPrompt, taskPrompt } from "./prompts";
import { loadProvider } from "./providers/registry";
import {
  type ChangesResult,
  changesResultSchema,
  type FindingsResult,
  findingsResultSchema,
  type LetterResult,
  letterResultSchema,
  type TailorResult,
  tailorResultSchema,
} from "./schemas";
import type {
  AiCallResult,
  AiError,
  AiProviderAdapter,
  AiProviderId,
  AiUsage,
} from "./types";

export interface AiRunRequest {
  mode: AiMode;
  resume: Resume;
  vacancy: string;
  targetLanguage: ResumeLanguage;
  uiLanguage: string;
  masking: MaskOptions;
  /** The local ATS check's findings, so the AI does not repeat them. */
  localFindings: ReadonlyArray<string>;
}

export interface PreparedRequest {
  system: string;
  /** Exactly what is sent: masked. */
  prompt: string;
  mask: MaskMap;
  fields: ReadonlyArray<AiField>;
  editable: ReadonlyArray<string>;
  inputTokens: number;
  outputTokens: number;
  maxTokens: number;
}

/**
 * Builds the request without sending it: the preview the user reviews
 * before consenting, and the estimate of its size.
 */
export function prepareRequest(request: AiRunRequest): PreparedRequest {
  const scope = request.mode === "translate" ? "all" : "content";
  const fields = buildAiFields(request.resume, scope);
  const editable =
    request.mode === "cover-letter" ? [] : A.map(fields, (field) => field.path);
  const system = systemPrompt({
    resumeLanguage: request.resume.language,
    uiLanguage: request.uiLanguage,
  });
  const raw = taskPrompt({
    mode: request.mode,
    fields,
    editable,
    vacancy: S.trim(request.vacancy),
    targetLanguage: request.targetLanguage,
    localFindings: request.localFindings,
  });
  const mask = buildMask(request.resume, request.masking, raw);
  const prompt = maskText(raw, mask);
  const editableText = A.join(
    A.map(fields, (field) => field.text),
    "\n",
  );
  const outputTokens = estimateOutputTokens(
    request.mode,
    estimateTokens(editableText),
  );
  return {
    system,
    prompt,
    mask,
    fields,
    editable,
    inputTokens: estimateTokens(system + prompt),
    outputTokens,
    maxTokens: maxTokensFor(outputTokens),
  };
}

export type AiRunOutput =
  | { mode: "rewrite" | "translate"; value: ChangesResult }
  | { mode: "tailor"; value: TailorResult }
  | { mode: "ats" | "consistency"; value: FindingsResult }
  | { mode: "cover-letter"; value: LetterResult };

export interface AiRunResult {
  output: AiRunOutput;
  usage: AiUsage;
  /** The fields as they were sent (unmasked), for the before/after view. */
  fields: ReadonlyArray<AiField>;
}

export interface AiConnection {
  provider: AiProviderId;
  model: string;
  apiKey: string;
  baseUrl: string;
  signal: AbortSignal;
}

/** One call, retried once when the answer fails its schema. */
async function callWithRetry<T>(
  adapter: AiProviderAdapter,
  params: Omit<Parameters<AiProviderAdapter["generate"]>[0], "schema"> & {
    schema: import("zod").ZodType<T>;
  },
): Promise<R.Result<AiCallResult<T>, AiError>> {
  const first = await adapter.generate(params);
  if (R.isOk(first)) return first;
  const error = R.getExn(R.flip(first));
  if (error.kind !== "invalid-response" || params.signal.aborted) return first;
  return adapter.generate({
    ...params,
    prompt: params.prompt + retryNote(error.detail),
  });
}

/** Keeps a proposed change only if it names an editable field and differs. */
function keepChanges<T extends { changes: ChangesResult["changes"] }>(
  value: T,
  fields: ReadonlyArray<AiField>,
): T {
  const byPath = new Map(
    A.map(fields, (field) => [field.path, field] as const),
  );
  return {
    ...value,
    changes: A.filter(value.changes, (change) => {
      const field = byPath.get(change.path);
      return field !== undefined && S.trim(change.after) !== S.trim(field.text);
    }),
  };
}

/**
 * Sends one AI task to the user's provider with the user's key, straight
 * from the browser, and returns the validated, unmasked answer. Nothing is
 * applied to the résumé here; the user reviews every change first.
 */
export async function runAi(
  request: AiRunRequest,
  connection: AiConnection,
): Promise<R.Result<AiRunResult, AiError>> {
  const prepared = prepareRequest(request);
  const adapter = await loadProvider(connection.provider);
  const base = {
    apiKey: connection.apiKey,
    model: connection.model,
    baseUrl: connection.baseUrl,
    system: prepared.system,
    prompt: prepared.prompt,
    maxTokens: prepared.maxTokens,
    signal: connection.signal,
  };
  const finish = <T>(
    result: R.Result<AiCallResult<T>, AiError>,
    wrap: (value: T) => AiRunOutput,
  ): R.Result<AiRunResult, AiError> =>
    R.map(result, (call) => ({
      output: wrap(unmaskDeep(call.value, prepared.mask)),
      usage: call.usage,
      fields: prepared.fields,
    }));

  switch (request.mode) {
    case "rewrite":
    case "translate": {
      const mode = request.mode;
      const result = await callWithRetry(adapter, {
        ...base,
        schema: changesResultSchema,
      });
      return finish(result, (value) => ({
        mode,
        value: keepChanges(value, prepared.fields),
      }));
    }
    case "tailor": {
      const result = await callWithRetry(adapter, {
        ...base,
        schema: tailorResultSchema,
      });
      return finish(result, (value) => ({
        mode: "tailor",
        value: keepChanges(value, prepared.fields),
      }));
    }
    case "ats":
    case "consistency": {
      const mode = request.mode;
      const result = await callWithRetry(adapter, {
        ...base,
        schema: findingsResultSchema,
      });
      return finish(result, (value) => ({
        mode,
        value: keepChanges(value, prepared.fields),
      }));
    }
    case "cover-letter": {
      const result = await callWithRetry(adapter, {
        ...base,
        schema: letterResultSchema,
      });
      return finish(result, (value) => ({ mode: "cover-letter", value }));
    }
  }
}

/** Checks a key with the provider's free model listing. */
export async function verifyAiKey(params: {
  provider: AiProviderId;
  apiKey: string;
  baseUrl: string;
  signal: AbortSignal;
}): Promise<R.Result<true, AiError>> {
  const adapter = await loadProvider(params.provider);
  return adapter.verifyKey(params);
}
