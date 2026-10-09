import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { A, R } from "@mobily/ts-belt";
import { aiError, kindFromStatus, networkError } from "../errors";
import type { AiError, AiProviderAdapter } from "../types";

/**
 * Models that accept the server-side refusal fallback: when a safety
 * classifier declines, the API re-runs the request on a fallback model
 * inside the same call instead of failing it.
 */
const FALLBACK_MODELS: ReadonlyArray<string> = [
  "claude-opus-5-5",
  "claude-sonnet-5-5",
  "claude-fable-5-1",
  "claude-opus-5",
];

function client(apiKey: string, baseUrl: string): Anthropic {
  return new Anthropic({
    apiKey,
    baseURL: baseUrl || undefined,
    // The key is the user's own and the call is theirs: Kast has no server
    // to proxy it through, which is the point.
    dangerouslyAllowBrowser: true,
    maxRetries: 1,
    timeout: 180_000,
  });
}

function toAiError(error: unknown, signal: AbortSignal): AiError {
  if (error instanceof Anthropic.APIUserAbortError) {
    return networkError(error, signal);
  }
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return aiError("timeout", error.message);
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return networkError(error, signal);
  }
  if (error instanceof Anthropic.APIError && typeof error.status === "number") {
    return aiError(
      kindFromStatus(error.status, error.message),
      error.message,
      error.status,
    );
  }
  return aiError(
    "invalid-response",
    error instanceof Error ? error.message : String(error),
  );
}

export const anthropicProvider: AiProviderAdapter = {
  async verifyKey(params) {
    try {
      await client(params.apiKey, params.baseUrl).models.list(
        { limit: 1 },
        { signal: params.signal },
      );
      return R.makeOk(true);
    } catch (error) {
      return R.makeError(toAiError(error, params.signal));
    }
  },

  async generate(params) {
    const fallback = A.includes(FALLBACK_MODELS, params.model)
      ? {
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default" as const,
        }
      : {};
    try {
      const response = await client(
        params.apiKey,
        params.baseUrl,
      ).beta.messages.parse(
        {
          model: params.model,
          max_tokens: params.maxTokens,
          system: params.system,
          messages: [{ role: "user", content: params.prompt }],
          output_config: {
            format: zodOutputFormat(params.schema),
            effort: "medium",
          },
          ...fallback,
        },
        { signal: params.signal },
      );
      if (response.stop_reason === "refusal") {
        return R.makeError(
          aiError(
            "refused",
            response.stop_details?.explanation ?? "The model declined.",
          ),
        );
      }
      if (response.stop_reason === "max_tokens") {
        return R.makeError(
          aiError(
            "invalid-response",
            "The answer was cut off by its length limit.",
          ),
        );
      }
      const value = response.parsed_output;
      if (value === null || value === undefined) {
        return R.makeError(
          aiError("invalid-response", "The answer did not match the schema."),
        );
      }
      return R.makeOk({
        value,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      });
    } catch (error) {
      return R.makeError(toAiError(error, params.signal));
    }
  },
};
