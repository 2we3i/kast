import type { R } from "@mobily/ts-belt";
import type { z } from "zod";

export type AiProviderId = "anthropic" | "gemini";

export interface AiModelInfo {
  id: string;
  label: string;
  /** USD per million input tokens, for the approximate cost shown up front. */
  inputPerMillion: number;
  /** USD per million output tokens. */
  outputPerMillion: number;
}

export type AiErrorKind =
  | "invalid-key"
  | "permission"
  | "insufficient-funds"
  | "rate-limit"
  | "overloaded"
  | "timeout"
  | "network"
  | "server"
  | "refused"
  | "invalid-response"
  | "bad-request"
  | "cancelled";

export interface AiError {
  kind: AiErrorKind;
  /** The provider's own wording, shown under the explanation. Never the key. */
  detail: string;
  status?: number;
}

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface AiCallParams<T> {
  apiKey: string;
  model: string;
  /** A user-set endpoint (a proxy of their own); empty for the provider's. */
  baseUrl: string;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  maxTokens: number;
  signal: AbortSignal;
}

export interface AiCallResult<T> {
  value: T;
  usage: AiUsage;
}

/**
 * One AI provider behind a common interface. Adding a provider means one
 * adapter file, one catalog entry, and one registry line; nothing else in
 * the app changes.
 */
export interface AiProviderAdapter {
  /** The cheapest request that proves the key works; spends no tokens. */
  verifyKey: (params: {
    apiKey: string;
    baseUrl: string;
    signal: AbortSignal;
  }) => Promise<R.Result<true, AiError>>;
  /**
   * One structured call. Resolves to a value already validated against
   * `schema`, or to an error; it never throws.
   */
  generate: <T>(
    params: AiCallParams<T>,
  ) => Promise<R.Result<AiCallResult<T>, AiError>>;
}
