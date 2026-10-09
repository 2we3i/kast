import { D, G, R, S } from "@mobily/ts-belt";
import { z } from "zod";
import { aiError, kindFromStatus, networkError } from "../errors";
import type { AiError, AiProviderAdapter } from "../types";

const BASE = "https://generativelanguage.googleapis.com";

function endpoint(baseUrl: string, path: string): string {
  return `${S.replaceByRe(baseUrl || BASE, /\/+$/, "")}${path}`;
}

interface GeminiErrorBody {
  error?: { code?: number; message?: string; status?: string };
}

interface GeminiResponse {
  candidates?: ReadonlyArray<{
    content?: { parts?: ReadonlyArray<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

async function failure(response: Response): Promise<AiError> {
  const body = (await response.json().catch(() => ({}))) as GeminiErrorBody;
  const detail = `${body.error?.status ?? ""} ${body.error?.message ?? response.statusText}`;
  return aiError(
    kindFromStatus(response.status, detail),
    detail,
    response.status,
  );
}

/** The JSON schema Gemini's `responseJsonSchema` takes, minus `$schema`. */
function responseSchema(schema: z.ZodType): Record<string, unknown> {
  return D.deleteKey(
    z.toJSONSchema(schema) as Record<string, unknown>,
    "$schema",
  );
}

function answerText(body: GeminiResponse): string {
  const parts = body.candidates?.[0]?.content?.parts ?? [];
  return parts.map((part) => part.text ?? "").join("");
}

/**
 * Google Gemini over its REST API, called straight from the browser. The key
 * travels in the `x-goog-api-key` header, never in the URL, so it stays out
 * of any log that records addresses.
 */
export const geminiProvider: AiProviderAdapter = {
  async verifyKey(params) {
    try {
      const response = await fetch(
        endpoint(params.baseUrl, "/v1beta/models?pageSize=1"),
        {
          headers: { "x-goog-api-key": params.apiKey },
          signal: params.signal,
          referrerPolicy: "no-referrer",
        },
      );
      if (!response.ok) return R.makeError(await failure(response));
      return R.makeOk(true);
    } catch (error) {
      return R.makeError(networkError(error, params.signal));
    }
  },

  async generate(params) {
    try {
      const response = await fetch(
        endpoint(
          params.baseUrl,
          `/v1beta/models/${encodeURIComponent(params.model)}:generateContent`,
        ),
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": params.apiKey,
          },
          referrerPolicy: "no-referrer",
          signal: params.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: params.system }] },
            contents: [{ role: "user", parts: [{ text: params.prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseJsonSchema: responseSchema(params.schema),
              maxOutputTokens: params.maxTokens,
              temperature: 0.4,
            },
          }),
        },
      );
      if (!response.ok) return R.makeError(await failure(response));
      const body = (await response.json()) as GeminiResponse;
      if (body.promptFeedback?.blockReason) {
        return R.makeError(aiError("refused", body.promptFeedback.blockReason));
      }
      const finish = body.candidates?.[0]?.finishReason ?? "";
      if (finish === "SAFETY" || finish === "PROHIBITED_CONTENT") {
        return R.makeError(aiError("refused", finish));
      }
      if (finish === "MAX_TOKENS") {
        return R.makeError(
          aiError(
            "invalid-response",
            "The answer was cut off by its length limit.",
          ),
        );
      }
      const parsed = parseJson(answerText(body));
      const valid = G.isNullable(parsed)
        ? null
        : params.schema.safeParse(parsed);
      if (!valid?.success) {
        return R.makeError(
          aiError(
            "invalid-response",
            valid?.error.message ?? "The answer was not JSON.",
          ),
        );
      }
      return R.makeOk({
        value: valid.data,
        usage: {
          inputTokens: body.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: body.usageMetadata?.candidatesTokenCount ?? 0,
        },
      });
    } catch (error) {
      return R.makeError(networkError(error, params.signal));
    }
  },
};

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
