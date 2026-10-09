import { S } from "@mobily/ts-belt";
import type { AiError, AiErrorKind } from "./types";

/** An error as the UI shows it, with the key scrubbed from any detail. */
export function aiError(
  kind: AiErrorKind,
  detail: string,
  status?: number,
): AiError {
  const scrubbed = S.replaceByRe(
    detail,
    /(sk-ant-[\w-]{6})[\w-]+|(AIza[\w-]{4})[\w-]+/g,
    "$1$2…",
  );
  return { kind, detail: S.slice(scrubbed, 0, 400), status };
}

/**
 * The HTTP status of a provider error, read as one of the cases the UI
 * explains. `detail` decides between "out of credit" and other 400s.
 */
export function kindFromStatus(status: number, detail: string): AiErrorKind {
  const text = S.toLowerCase(detail);
  if (status === 401) return "invalid-key";
  if (status === 402) return "insufficient-funds";
  if (status === 403) return "permission";
  if (status === 408) return "timeout";
  if (status === 429) {
    return /quota|billing|exhausted/.test(text)
      ? "insufficient-funds"
      : "rate-limit";
  }
  if (status === 529 || status === 503) return "overloaded";
  if (status >= 500) return "server";
  if (/credit balance|billing|payment/.test(text)) return "insufficient-funds";
  if (/api key not valid|invalid api key|api_key_invalid/.test(text)) {
    return "invalid-key";
  }
  return "bad-request";
}

/**
 * A failed fetch with no response: the network, or a CORS rejection (which
 * the browser reports the same way, on purpose).
 */
export function networkError(error: unknown, signal: AbortSignal): AiError {
  if (signal.aborted) {
    const reason = signal.reason as { name?: string } | undefined;
    return reason?.name === "TimeoutError"
      ? aiError("timeout", "The provider did not answer in time.")
      : aiError("cancelled", "Cancelled.");
  }
  const message = error instanceof Error ? error.message : String(error);
  return aiError("network", message);
}
