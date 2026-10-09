import { O } from "@mobily/ts-belt";
import { modelInfo } from "./catalog";
import type { AiMode } from "./prompts";
import type { AiProviderId } from "./types";

/**
 * A rough token count: about 3.5 characters a token for Latin text, closer
 * to 2.5 for Cyrillic, which tokenizers split finer. Good enough to show the
 * order of magnitude before sending; the provider bills the real count.
 */
export function estimateTokens(text: string): number {
  const cyrillic = (text.match(/[Ѐ-ӿ]/g) ?? []).length;
  const latin = text.length - cyrillic;
  return Math.ceil(latin / 3.5 + cyrillic / 2.5);
}

/** How long an answer each mode tends to write, from the editable text. */
export function estimateOutputTokens(mode: AiMode, editableTokens: number) {
  switch (mode) {
    case "rewrite":
    case "tailor":
      return Math.round(editableTokens * 1.2 + 400);
    case "translate":
      return Math.round(editableTokens * 1.6 + 300);
    case "ats":
    case "consistency":
      return 1500;
    case "cover-letter":
      return 1000;
  }
}

/**
 * The answer's token ceiling: room for twice the expected length (and the
 * model's thinking), bounded so a runaway answer cannot run up a bill.
 */
export function maxTokensFor(expectedOutput: number): number {
  return Math.min(32_000, Math.max(4_000, expectedOutput * 3));
}

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  /** USD, or null for a model typed in by hand (no known price). */
  usd: number | null;
}

export function estimateCost(params: {
  provider: AiProviderId;
  model: string;
  inputTokens: number;
  outputTokens: number;
}): CostEstimate {
  const usd = O.mapWithDefault(
    modelInfo(params.provider, params.model),
    null as number | null,
    (info) =>
      (params.inputTokens * info.inputPerMillion +
        params.outputTokens * info.outputPerMillion) /
      1_000_000,
  );
  return {
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    usd,
  };
}

/** A dollar amount for display; sub-cent amounts read as "< $0.01". */
export function formatUsd(usd: number, locale: string): string {
  const format = (value: number, digits: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: digits,
    }).format(value);
  if (usd > 0 && usd < 0.01) return `< ${format(0.01, 2)}`;
  return format(usd, usd < 1 ? 3 : 2);
}
